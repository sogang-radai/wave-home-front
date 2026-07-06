/**
 * ChatMessages — shared message area + input used by both ChatPage and ChatPopup.
 * Handles message list rendering (streaming UI, tool pills, thinking toggle),
 * welcome screen animation, and textarea input with auto-resize + Ctrl+Enter.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import chatApi from '../api/chatApi';
import settingsApi from '../api/settingsApi';
import { MarkdownMessage } from './MarkdownMessage';
import { WaveTransitionOverlay } from '../WaveTransitionOverlay';

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

function MessageBubble({ msg, isLast }) {
  return (
    <div className={`chat-bubble-row ${msg.role}${isLast ? ' is-new' : ''}`}>
      {msg.role === 'assistant' && (
        <div className="chat-bubble-avatar">✦</div>
      )}
      <div className={`chat-bubble ${msg.role}${msg.status === 'streaming' ? ' streaming' : ''}`}>
        {/* Tool event pills — only show while running */}
        {msg.toolEvents?.some((te) => te.status === 'running') && (
          <div className="chat-tool-pills">
            {msg.toolEvents
              .filter((te) => te.status === 'running')
              .map((te, ti) => (
                <span key={ti} className="chat-tool-pill">
                  <span className="chat-tool-spinner" />
                  {te.label || te.name}
                </span>
              ))}
          </div>
        )}
        {/* Thinking / reasoning toggle */}
        {msg.reasoning && (
          <details className="chat-thinking">
            <summary className="chat-thinking-summary">생각 과정 보기</summary>
            <div className="chat-thinking-body">{msg.reasoning}</div>
          </details>
        )}
        {msg.role === 'assistant' ? (
          <>
            <MarkdownMessage text={msg.text} />
            {msg.status === 'streaming' && !msg.text && (
              <span className="chat-streaming-dots-anim" aria-hidden="true" />
            )}
          </>
        ) : (
          msg.text
        )}
        {msg.status === 'streaming' && msg.text && (
          <span className="chat-cursor-blink" aria-hidden="true" />
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
  compact, // true = popup/mini compact layout
  // header slot props
  topbarLeft,
  topbarRight,
  // bubble transition overlay — scoped to the message area only (page mode)
  waveTransition,
  initialDraft,
  onConsumeInitialDraft,
}) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);
  const ctrlEnterRef = useRef(false);
  const textareaRef = useAutoResizeTextarea(draft);

  const [shownSuggestions, setShownSuggestions] = useState([]);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    onConsumeInitialDraft?.();
  }, [initialDraft, onConsumeInitialDraft, textareaRef]);

  useEffect(() => {
    chatApi.getSuggestions().then((res) => {
      setShownSuggestions([...res.suggestionPool].sort(() => Math.random() - 0.5).slice(0, compact ? 3 : 4));
    });
    settingsApi.getAiAgentSettings().then((s) => {
      ctrlEnterRef.current = s.ctrlEnterSend ?? false;
    });
  }, [compact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback((text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.overflowY = 'hidden'; }
  }, [draft, onSend, textareaRef]);

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
        {waveTransition && <WaveTransitionOverlay active={waveTransition} />}
        <div className={msgAreaClass} style={{ userSelect: 'text' }}>
          {isNewChat ? (
            <div className={`chat-welcome${chatEntered ? ' chat-welcome--entered' : ''}`}>
              <div className="chat-welcome-icon">✦</div>
              {!compact && <h2 className="chat-welcome-title">WaveAI에게 무엇이든 물어보세요</h2>}
              {compact && <p className="chat-popup-welcome-hint">무엇이든 물어보세요</p>}
              {!compact && <p className="chat-welcome-sub">수면·자세·심박·가전까지, 건강 데이터 기반으로 답변드려요</p>}
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
                    <span className={compact ? 'chat-popup-suggestion-icon' : 'chat-suggestion-icon'}>{s.icon}</span>
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
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className={inputAreaClass}>
        <form
          className={inputFormClass}
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <textarea
            ref={textareaRef}
            className={inputClass}
            rows={1}
            placeholder="메시지를 입력하세요..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="chat-send-btn"
            aria-label="보내기"
            disabled={!draft.trim()}
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
