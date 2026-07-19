/**
 * ChatMessages — shared message area + input used by both ChatPage and ChatPopup.
 * Handles message list rendering (streaming UI, tool pills, thinking toggle),
 * welcome screen animation, and textarea input with auto-resize + Ctrl+Enter.
 */
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import chatApi from '../../api/chatApi';
import settingsApi from '../../api/settingsApi';
import { IS_DEMO_MODE } from '../../api/config';
import { MarkdownMessage } from './MarkdownMessage';
import { WaveTransitionOverlay } from '../../WaveTransitionOverlay';
import { ChatBotIcon } from '../../components/icons/ChatBotIcon';
import { useChatMicStt } from './useChatMicStt';

const SUGGESTION_ICONS = {
  moon: '🌙',
  posture: '🧘',
  heart: '❤️',
  home: '🏠',
  plan: '📋',
  sleep: '💤',
  temp: '🌡️',
  energy: '⚡',
};

function suggestionIcon(icon) {
  if (!icon) return '✦';
  return SUGGESTION_ICONS[icon] || icon;
}

/** Browser mic requires a secure context (HTTPS / localhost). */
function canUseBrowserMic() {
  return typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

export function useAutoResizeTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Set to 0 first so scrollHeight reflects full content height
    el.style.overflowY = 'hidden';
    el.style.height = '0';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    if (el.scrollHeight > 200) el.style.overflowY = 'auto';
  }, [value]);
  return ref;
}

function activityLabel(msg) {
  if (msg.status !== 'streaming') return null;
  if (msg.text) return null;
  const tools = msg.toolEvents || [];
  // Tool log already shows progress — avoid an extra activity row that
  // appears after the last tool and vanishes when tokens start (layout jump).
  if (tools.length > 0) return null;
  if (msg.activityPhase === 'writing') return '답변 작성 중…';
  return '생각 중…';
}

const TOOL_BASE_LABELS = {
  query_db: 'DB 조회',
  rag_search: '메모리 검색',
  list_devices: '기기 목록 조회',
  get_device_classes: '기기 종류 조회',
  get_device_capabilities: '기기 기능 조회',
  query_device: '기기 조회',
  control_device: '기기 제어',
  get_schedule_tasks: '일정 조회',
  update_schedule_task: '일정 수정',
};

/** Consecutive same-name tool calls → one display row (status aggregated). */
function groupConsecutiveTools(toolEvents, { holdRunning = false } = {}) {
  const groups = [];
  for (const te of toolEvents) {
    const prev = groups[groups.length - 1];
    if (prev && prev.name === te.name) {
      prev.items.push(te);
    } else {
      groups.push({ name: te.name, items: [te] });
    }
  }

  return groups.map((group, gi) => {
    const { name, items } = group;
    const anyRunning = items.some((t) => t.status === 'running');
    const failed = items.filter((t) => t.status === 'failed').length;
    // Sequential tool execution finishes one before the next starts — without
    // holdRunning the label would flash 완료→중 on every handoff.
    const running = anyRunning || holdRunning;
    let status = 'running';
    if (!running) {
      status = failed > 0 ? 'failed' : 'done';
    }

    const base =
      TOOL_BASE_LABELS[name]
      || (items[0].label || name).replace(/\s*(중|완료|실패)\s*$/u, '');

    // Keep the main label stable while work is in flight so each completion
    // does not flash "완료" ↔ "중" or tick progress counters.
    let label;
    let resultSummary;
    if (running) {
      label = `${base} 중`;
      // Avoid per-completion text churn ("3개"→"4개", "3/10"→"4/10").
      resultSummary = undefined;
    } else if (failed > 0 && failed === items.length) {
      label = `${base} 실패`;
      resultSummary = items.length > 1 ? `${items.length}회` : items[0].resultSummary;
    } else if (failed > 0) {
      label = `${base} 완료`;
      resultSummary = items.length > 1
        ? `${items.length}회 · ${failed} 실패`
        : items[0].resultSummary;
    } else {
      label = `${base} 완료`;
      resultSummary = items.length > 1 ? `${items.length}회` : items[0].resultSummary;
    }

    return {
      key: `${name}-${gi}`,
      name,
      status,
      label,
      resultSummary,
      count: items.length,
    };
  });
}

function ToolCallLog({ toolEvents = [], hasText, streaming = false }) {
  const [expanded, setExpanded] = useState(false);
  const hadTextRef = useRef(false);
  const displayRows = groupConsecutiveTools(toolEvents, {
    holdRunning: streaming && !hasText,
  });

  useEffect(() => {
    if (hasText && !hadTextRef.current) {
      setExpanded(false);
    }
    hadTextRef.current = hasText;
  }, [hasText]);

  if (!toolEvents.length) return null;

  const collapsed = hasText && !expanded;
  const running = toolEvents.some((te) => te.status === 'running');
  const failedCount = toolEvents.filter((te) => te.status === 'failed').length;
  const summary = running
    ? `도구 실행 중 (${toolEvents.length})`
    : failedCount > 0
      ? `도구 ${toolEvents.length}개 사용 · ${failedCount}개 실패`
      : `도구 ${toolEvents.length}개 사용`;

  return (
    <div
      className={[
        'chat-tool-log',
        hasText ? 'has-response' : '',
        collapsed ? 'is-collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      {hasText && (
        <button
          type="button"
          className="chat-tool-log-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={!collapsed}
        >
          <span
            className={`chat-tool-log-chevron${collapsed ? '' : ' is-open'}`}
            aria-hidden="true"
          />
          <span>{summary}</span>
        </button>
      )}
      <div className="chat-tool-log-body" aria-hidden={collapsed && hasText}>
        <div className="chat-tool-log-lines">
          {displayRows.map((row) => (
            <div
              key={row.key}
              className={[
                'chat-tool-line',
                row.status === 'failed' ? 'failed' : row.status === 'done' ? 'done' : 'running',
              ].filter(Boolean).join(' ')}
              title={row.resultSummary || undefined}
            >
              <span className="chat-tool-line-icon" aria-hidden="true">
                {row.status === 'running' ? (
                  <span className="chat-tool-spinner" />
                ) : row.status === 'failed' ? (
                  <span className="chat-tool-fail">×</span>
                ) : (
                  <span className="chat-tool-check">✓</span>
                )}
              </span>
              <span className="chat-tool-line-text">
                <span className="chat-tool-line-label">{row.label}</span>
                {row.resultSummary ? (
                  <span className="chat-tool-line-result">{row.resultSummary}</span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isLast, isPinned, rowRef }) {
  const activity = activityLabel(msg);
  const showThinking = msg.reasoning && (msg.status === 'streaming' || msg.showReasoning);
  const hasText = Boolean(msg.text?.trim());

  return (
    <div
      ref={rowRef}
      className={[
        'chat-bubble-row',
        msg.role,
        isLast ? 'is-new' : '',
        isPinned ? 'is-pinned' : '',
      ].filter(Boolean).join(' ')}
    >
      {msg.role === 'assistant' && (
        <div className="chat-bubble-avatar" aria-hidden="true">
          <ChatBotIcon size={18} />
        </div>
      )}
      <div className={`chat-bubble ${msg.role}${msg.status === 'streaming' ? ' streaming' : ''}`}>
        {activity && (
          <div className="chat-activity-line">
            <span className="chat-activity-spinner" aria-hidden="true" />
            {activity}
          </div>
        )}

        {msg.toolEvents?.length > 0 && (
          <ToolCallLog
            toolEvents={msg.toolEvents}
            hasText={hasText}
            streaming={msg.status === 'streaming'}
          />
        )}

        {showThinking && (
          <details className="chat-thinking" open={msg.status === 'streaming'}>
            <summary className="chat-thinking-summary">생각 과정</summary>
            <div className="chat-thinking-body">{msg.reasoning}</div>
          </details>
        )}

        {msg.role === 'assistant' ? (
          hasText ? (
            <MarkdownMessage
              text={msg.text}
              streaming={msg.status === 'streaming'}
            />
          ) : null
        ) : (
          msg.text
        )}

        {msg.status === 'streaming' && !msg.text && !activity && !msg.toolEvents?.length && (
          <span className="chat-streaming-dots-anim" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function ChatMessages({
  messages,
  isNewChat,
  chatEntered,
  onSend,
  sending = false,
  compact, // true = popup/mini compact layout
  conversationKey,
  // header slot props
  topbarLeft,
  topbarRight,
  // bubble transition overlay — scoped to the message area only (page mode)
  waveTransition,
  initialDraft,
  onConsumeInitialDraft,
}) {
  const [draft, setDraft] = useState('');
  const [spacerPx, setSpacerPx] = useState(0);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [pinNonce, setPinNonce] = useState(0);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const spacerRef = useRef(null);
  const bubbleRefs = useRef(new Map());
  const pinnedUserIdRef = useRef(null);
  const pendingPinIdRef = useRef(null);
  const prevConvKeyRef = useRef(conversationKey);
  const prevMessageCountRef = useRef(messages.length);
  const ctrlEnterRef = useRef(false);
  const voiceAutoSendRef = useRef(false);
  const micPrefixRef = useRef('');
  const micStoppingRef = useRef(false);
  const draftRef = useRef(draft);
  const textareaRef = useAutoResizeTextarea(draft);
  const [micError, setMicError] = useState('');
  const [micSupported] = useState(() => canUseBrowserMic());

  const [shownSuggestions, setShownSuggestions] = useState([]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const focusInput = useCallback((delayMs = 0) => {
    window.setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
    }, delayMs);
  }, [textareaRef]);

  // Entering chat / switching conversation → focus composer.
  useEffect(() => {
    focusInput(chatEntered || compact ? 80 : 40);
  }, [conversationKey, isNewChat, chatEntered, compact, focusInput]);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    focusInput(0);
    onConsumeInitialDraft?.();
  }, [initialDraft, onConsumeInitialDraft, focusInput]);

  useEffect(() => {
    chatApi.getSuggestions()
      .then((res) => {
        const pool = Array.isArray(res?.suggestionPool) ? res.suggestionPool : [];
        setShownSuggestions([...pool].sort(() => Math.random() - 0.5).slice(0, compact ? 3 : 4));
      })
      .catch(() => setShownSuggestions([]));
    settingsApi.getAiAgentSettings().then((s) => {
      ctrlEnterRef.current = s.ctrlEnterSend ?? false;
      voiceAutoSendRef.current = s.voiceAutoSend ?? false;
    }).catch(() => {});
  }, [compact]);

  const setBubbleRef = useCallback((id, node) => {
    if (id == null) return;
    const key = String(id);
    if (node) bubbleRefs.current.set(key, node);
    else bubbleRefs.current.delete(key);
  }, []);

  const scrollUserToTop = useCallback((userId) => {
    const area = scrollAreaRef.current;
    const bubble = bubbleRefs.current.get(String(userId));
    if (!area || !bubble) return false;

    // Apply pin padding before measuring so top air is empty (not prior bubbles).
    bubble.classList.add('is-pinned');

    const nextSpacer = Math.max(area.clientHeight - bubble.offsetHeight - 8, 120);
    if (spacerRef.current) {
      spacerRef.current.style.minHeight = `${nextSpacer}px`;
    }
    setSpacerPx(nextSpacer);
    setPinnedUserId(userId);
    pinnedUserIdRef.current = userId;

    const targetTop = bubble.getBoundingClientRect().top;
    const areaTop = area.getBoundingClientRect().top;
    const top = targetTop - areaTop + area.scrollTop;
    area.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return true;
  }, []);

  // After pin request (or DOM settle), keep trying until the bubble ref exists.
  useLayoutEffect(() => {
    const userId = pendingPinIdRef.current;
    if (userId == null) return undefined;

    if (scrollUserToTop(userId)) {
      pendingPinIdRef.current = null;
      return undefined;
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (scrollUserToTop(userId) || tries > 12) {
        pendingPinIdRef.current = null;
        window.clearInterval(timer);
      }
    }, 32);
    return () => window.clearInterval(timer);
  }, [pinNonce, scrollUserToTop]);

  // Conversation switch: jump to latest, clear pin.
  // Skip when leaving the empty "new" thread after the first send — pin handles that.
  useEffect(() => {
    if (prevConvKeyRef.current === conversationKey) return;
    const prevKey = prevConvKeyRef.current;
    prevConvKeyRef.current = conversationKey;

    if (prevKey === 'new' || prevKey == null) {
      // Let the pin effect treat the first user message as a growth event.
      prevMessageCountRef.current = 0;
      return;
    }

    prevMessageCountRef.current = messages.length;
    pendingPinIdRef.current = null;
    pinnedUserIdRef.current = null;
    setPinnedUserId(null);
    setSpacerPx(0);
    if (spacerRef.current) spacerRef.current.style.minHeight = '0px';
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  }, [conversationKey, messages.length]);

  // New user message → pin that bubble to the top (prior assistant history scrolls away).
  // user_added + assistant_start often batch into one render, so look through the
  // appended slice instead of only messages[messages.length - 1].
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const grew = messages.length > prevCount;
    prevMessageCountRef.current = messages.length;
    if (!grew) return;

    const appended = messages.slice(prevCount);
    const newUser = [...appended].reverse().find((m) => m.role === 'user' && m.id != null);
    if (newUser) {
      pendingPinIdRef.current = newUser.id;
      setPinnedUserId(newUser.id);
      setPinNonce((n) => n + 1);
      return;
    }

    // First paint of an existing thread (e.g. select conversation): stay at bottom.
    if (prevCount === 0 && messages.length > 0 && !pinnedUserIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages]);

  const handleSend = useCallback((text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t || sending) return;
    onSend(t);
    setDraft('');
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.overflowY = 'hidden'; }
    focusInput(0);
  }, [draft, onSend, textareaRef, sending, focusInput]);

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;
  const micStopRef = useRef(async () => {});
  const sendingRef = useRef(sending);
  sendingRef.current = sending;

  const finishMicSession = useCallback(async ({ abort = false, autoSend = false } = {}) => {
    if (micStoppingRef.current) return;
    micStoppingRef.current = true;
    try {
      await micStopRef.current({ abort });
    } finally {
      micStoppingRef.current = false;
    }

    if (abort) return;

    const text = draftRef.current.trim();
    if (autoSend && voiceAutoSendRef.current && text && !sendingRef.current) {
      handleSendRef.current(text);
    }
  }, []);

  const handleMicPartial = useCallback((text) => {
    if (micStoppingRef.current) return;
    const utterance = (text || '').trim();
    if (!utterance) return;
    const prefix = micPrefixRef.current;
    const next = [prefix, utterance].filter(Boolean).join(' ').trim();
    draftRef.current = next;
    setDraft(next);
  }, []);

  const handleMicEndpoint = useCallback((text) => {
    const utterance = (text || '').trim();
    if (utterance) {
      const prefix = micPrefixRef.current;
      const next = [prefix, utterance].filter(Boolean).join(' ').trim();
      // Commit so later teardown cannot wipe recognized text.
      micPrefixRef.current = next;
      draftRef.current = next;
      setDraft(next);
    }
    finishMicSession({ autoSend: true });
  }, [finishMicSession]);

  const handleMicError = useCallback((err) => {
    const code = err?.code || err?.name;
    let message = err?.message || '음성 인식을 시작할 수 없습니다.';
    if (code === 'NotAllowedError' || code === 'PermissionDeniedError') {
      message = '마이크 권한을 허용해주세요.';
    } else if (code === 'MEDIA_DEVICES_UNAVAILABLE' || code === 'MediaDevicesUnavailable') {
      message = err?.message
        || '마이크는 localhost 또는 HTTPS에서만 사용할 수 있습니다.';
    } else if (code === 'STT_BUSY') {
      message = '다른 음성 인식이 진행 중입니다.';
    } else if (code === 'STT_UNAVAILABLE') {
      message = '음성 인식을 사용할 수 없습니다.';
    } else if (typeof message === 'string' && message.includes('getUserMedia')) {
      message = '마이크는 localhost 또는 HTTPS에서만 사용할 수 있습니다. http://127.0.0.1:8510 으로 접속해 주세요.';
    }
    setMicError(message);
    window.setTimeout(() => setMicError(''), 4800);
  }, []);

  const { listening: micListening, start: micStart, stop: micStop } = useChatMicStt({
    onPartial: handleMicPartial,
    onEndpoint: handleMicEndpoint,
    onError: handleMicError,
  });
  micStopRef.current = micStop;

  const toggleMic = useCallback(async () => {
    setMicError('');
    if (micListening) {
      await finishMicSession({ autoSend: true });
      return;
    }
    if (sending) return;
    try {
      const settings = await settingsApi.getAiAgentSettings();
      voiceAutoSendRef.current = settings?.voiceAutoSend ?? false;
      ctrlEnterRef.current = settings?.ctrlEnterSend ?? false;
    } catch {
      // keep last known settings
    }
    // Keep whatever is already in the composer; STT appends after this prefix.
    micPrefixRef.current = draftRef.current.trim();
    try {
      await micStart();
    } catch {
      // onError already surfaced the message
    }
  }, [finishMicSession, micListening, micStart, sending]);

  // Insert a newline at the caret ourselves — don't rely on the browser's
  // default textarea behavior, which isn't reliably triggered once the
  // keydown has modifier keys involved.
  const insertNewlineAtCaret = useCallback((el) => {
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    setDraft((prev) => prev.slice(0, start) + '\n' + prev.slice(end));
    requestAnimationFrame(() => {
      try { el.selectionStart = el.selectionEnd = start + 1; } catch { /* noop */ }
    });
  }, [draft.length]);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    // macOS / Hangul IME: composition Confirm Enter must not send.
    if (e.nativeEvent.isComposing || e.isComposing || e.keyCode === 229) return;
    const modifierHeld = e.ctrlKey || e.metaKey;
    // ctrlEnterSend=true: Ctrl+Enter sends, plain Enter → newline.
    // ctrlEnterSend=false (default): plain Enter sends, Ctrl+Enter → newline.
    const shouldSend = ctrlEnterRef.current ? modifierHeld : !modifierHeld;
    e.preventDefault();
    if (shouldSend) {
      handleSend();
    } else {
      insertNewlineAtCaret(e.target);
    }
  };

  const inputAreaClass = compact ? 'chat-popup-input-area' : 'chat-input-area';
  const inputFormClass = compact ? 'chat-popup-input-form' : 'chat-input-form';
  const inputClass = compact ? 'chat-popup-input' : 'chat-input';
  const msgAreaClass = compact ? 'chat-popup-messages' : 'chat-messages-area';

  return (
    <div className={compact ? 'chat-core chat-core--compact' : 'chat-core'}>
      {/* Topbar slot — page mode only */}
      {!compact && (topbarLeft || topbarRight) && (
        <div className="chat-main-topbar">
          <div className="chat-topbar-left">{topbarLeft}</div>
          <div className="chat-topbar-right">{topbarRight}</div>
        </div>
      )}

      {/* Message area — bubble overlay is scoped here only, excluding the
          conversation list and the input box below. */}
      <div className="chat-messages-wrap">
        {isNewChat && waveTransition && <WaveTransitionOverlay active={waveTransition} />}
        <div
          ref={scrollAreaRef}
          className={`${msgAreaClass}${pinnedUserId ? ' is-pinning' : ''}`}
          style={{ userSelect: 'text' }}
        >
          {isNewChat ? (
            <div className={`chat-welcome${chatEntered ? ' chat-welcome--entered' : ''}`}>
              <div className="chat-welcome-icon" aria-hidden="true">
                <ChatBotIcon size={120} />
              </div>
              {!compact && <h2 className="chat-welcome-title">WaveChat에게 무엇이든 물어보세요</h2>}
              {compact && <p className="chat-popup-welcome-hint">무엇이든 물어보세요</p>}
              {!compact && <p className="chat-welcome-sub">수면·자세·심박·가전까지, 건강 데이터 기반으로 답변드려요</p>}
              {IS_DEMO_MODE && !compact && (
                <div className="chat-demo-notice" role="note">
                  <strong>시연 모드 안내</strong>
                  <p>여러 사용자가 함께 이용하는 데모 환경입니다. 모두가 원활하게 사용할 수 있도록 필요한 만큼만 이용해 주세요.</p>
                </div>
              )}
              <div className={compact ? 'chat-popup-suggestions' : 'chat-suggestions-grid'}>
                {shownSuggestions.map((s, idx) => (
                  <button
                    key={s.id || s.label}
                    className={compact
                      ? 'chat-popup-suggestion'
                      : `chat-suggestion-card${chatEntered ? ' chat-suggestion-card--entered' : ''}`}
                    style={{ '--card-idx': idx }}
                    onClick={() => handleSend(s.prompt)}
                  >
                    <span className={compact ? 'chat-popup-suggestion-icon' : 'chat-suggestion-icon'}>{suggestionIcon(s.icon)}</span>
                    {!compact && <strong>{s.label}</strong>}
                    <span>{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={compact ? 'chat-popup-bubble-list' : 'chat-bubble-list'}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || i}
                  msg={msg}
                  isLast={i === messages.length - 1}
                  isPinned={msg.role === 'user' && String(msg.id) === String(pinnedUserId)}
                  rowRef={msg.id != null ? (node) => setBubbleRef(msg.id, node) : undefined}
                />
              ))}
              <div
                ref={spacerRef}
                className="chat-scroll-spacer"
                style={{ minHeight: spacerPx }}
                aria-hidden="true"
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className={inputAreaClass}>
        {micSupported && micError && <div className="chat-mic-error" role="status">{micError}</div>}
        <form
          className={inputFormClass}
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <textarea
            ref={textareaRef}
            className={inputClass}
            rows={1}
            placeholder={micListening ? '듣고 있어요…' : '메시지를 입력하세요...'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {micSupported && (
            <button
              type="button"
              className={`chat-mic-btn${micListening ? ' is-listening' : ''}`}
              aria-label={micListening ? '음성 인식 중지' : '음성 인식 시작'}
              aria-pressed={micListening}
              disabled={sending && !micListening}
              onClick={toggleMic}
            >
              <svg width={compact ? 15 : 17} height={compact ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="chat-send-btn"
            aria-label="보내기"
            disabled={!draft.trim() || sending || micListening}
          >
            <svg width={compact ? 15 : 17} height={compact ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
