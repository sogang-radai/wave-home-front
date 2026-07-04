import { useState, useEffect, useRef, useCallback } from 'react';
import chatApi from '../api/chatApi';
import settingsApi from '../api/settingsApi';
import { MarkdownMessage } from './MarkdownMessage';
import './chat.css';

const POPUP_MIN_W = 280;
const POPUP_MIN_H = 300;
const POPUP_MAX_W = 680;
const POPUP_MAX_H = 760;
const MINI_MIN_W = 200;
const MINI_MAX_W = 600;
const MINI_H = 48;
const SNAP_MARGIN = 20;

const STORAGE_KEY_POS = 'chatPopupPos';
const STORAGE_KEY_SIZE = 'chatPopupSize';

function loadStoredPos() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_POS);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function loadStoredSize() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_SIZE);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function savePos(p) {
  try { localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(p)); } catch {}
}
function saveSize(s) {
  try { localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify(s)); } catch {}
}

function useAutoResizeTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);
  return ref;
}

export function ChatPopup({ mode, conversations, activeConvId, onSelectConv, onAddConv, onSendMessage, onExpand, onMini, onClose, sidebarWidth = 263 }) {
  const [draft, setDraft] = useState('');
  const [showConvList, setShowConvList] = useState(false);
  const messagesEndRef = useRef(null);
  const popupRef = useRef(null);
  const ctrlEnterRef = useRef(false);
  const textareaRef = useAutoResizeTextarea(draft);

  // Initial position: bottom-right corner
  const getDefaultPos = useCallback(() => {
    const w = 380;
    const h = 520;
    return {
      left: window.innerWidth - SNAP_MARGIN - w,
      top: window.innerHeight - SNAP_MARGIN - h,
      snapping: false,
    };
  }, []);

  const [pos, setPos] = useState(() => {
    const stored = loadStoredPos();
    return stored ? { ...stored, snapping: false } : null;
  });
  const [size, setSize] = useState(() => loadStoredSize() || { w: 380, h: 520 });
  // Track whether we've entered mini for the first time this session (for animation)
  const [prevMode, setPrevMode] = useState(mode);

  // When entering mini mode for the first time, snap to bottom-right
  useEffect(() => {
    if (mode === 'mini' && prevMode === 'page') {
      const mw = Math.min(MINI_MAX_W, Math.max(MINI_MIN_W, size.w));
      const newPos = {
        left: window.innerWidth - SNAP_MARGIN - mw,
        top: window.innerHeight - SNAP_MARGIN - MINI_H,
        snapping: true,
      };
      setPos(newPos);
      setTimeout(() => setPos((p) => p ? { ...p, snapping: false } : p), 450);
    }
    setPrevMode(mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    settingsApi.getAiAgentSettings().then((s) => {
      ctrlEnterRef.current = s.ctrlEnterSend ?? false;
    });
  }, []);

  const snapToCorner = useCallback((currentPos, currentSize, isMini) => {
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = currentSize.w;
    const h = currentSize.h;

    if (isMini) {
      // Mini mode snaps to any of 4 edges (full viewport)
      const snapLeft = cx < vw / 2;
      const snapTop = cy < vh / 2;
      const newPos = {
        left: snapLeft ? SNAP_MARGIN : vw - SNAP_MARGIN - w,
        top: snapTop ? SNAP_MARGIN : vh - SNAP_MARGIN - MINI_H,
        snapping: true,
      };
      setPos(newPos);
      savePos({ left: newPos.left, top: newPos.top });
      setTimeout(() => setPos((p) => p ? { ...p, snapping: false } : p), 420);
    } else {
      // Popup mode: snap to corners, left boundary = sidebarWidth
      const leftMin = sidebarWidth + SNAP_MARGIN;
      const snapLeft = cx < (vw + sidebarWidth) / 2;
      const snapTop = cy < vh / 2;
      const newPos = {
        left: snapLeft ? leftMin : vw - SNAP_MARGIN - w,
        top: snapTop ? SNAP_MARGIN : vh - SNAP_MARGIN - h,
        snapping: true,
      };
      setPos(newPos);
      savePos({ left: newPos.left, top: newPos.top });
      setTimeout(() => setPos((p) => p ? { ...p, snapping: false } : p), 420);
    }
  }, [sidebarWidth]);

  const handleHeaderPointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    let moved = false;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = mode === 'mini' ? me.clientY - startY : me.clientY - startY;
      moved = true;
      setPos({ left: startLeft + dx, top: startTop + dy, snapping: false });
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (moved) snapToCorner(pos, size, mode === 'mini');
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [mode, pos, size, snapToCorner]);

  const handleResizePointerDown = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      let newW = startW;
      let newH = startH;
      let newLeft = startLeft;
      let newTop = startTop;

      if (mode === 'mini') {
        // Mini: horizontal resize only
        if (dir.includes('e')) newW = Math.max(MINI_MIN_W, Math.min(MINI_MAX_W, startW + dx));
        if (dir.includes('w')) {
          newW = Math.max(MINI_MIN_W, Math.min(MINI_MAX_W, startW - dx));
          newLeft = startLeft + (startW - newW);
        }
      } else {
        if (dir.includes('e')) newW = Math.max(POPUP_MIN_W, Math.min(POPUP_MAX_W, startW + dx));
        if (dir.includes('w')) {
          newW = Math.max(POPUP_MIN_W, Math.min(POPUP_MAX_W, startW - dx));
          newLeft = startLeft + (startW - newW);
        }
        if (dir.includes('s')) newH = Math.max(POPUP_MIN_H, Math.min(POPUP_MAX_H, startH + dy));
        if (dir.includes('n')) {
          newH = Math.max(POPUP_MIN_H, Math.min(POPUP_MAX_H, startH - dy));
          newTop = startTop + (startH - newH);
        }
      }

      setSize((prev) => ({ ...prev, w: newW, h: mode === 'mini' ? prev.h : newH }));
      setPos({ left: newLeft, top: newTop, snapping: false });
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      // Save after resize
      setSize((s) => { saveSize(s); return s; });
      setPos((p) => { if (p) savePos({ left: p.left, top: p.top }); return p; });
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [mode]);

  // Initialize pos on first mount if not stored
  useEffect(() => {
    if (!pos) {
      setPos(getDefaultPos());
    }
  }, [pos, getDefaultPos]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConv?.messages || [];
  const isNewChat = !activeConvId || messages.length === 0;

  const [popupSuggestions, setPopupSuggestions] = useState([]);
  useEffect(() => {
    chatApi.getSuggestions().then((res) => {
      setPopupSuggestions([...res.suggestionPool].sort(() => Math.random() - 0.5).slice(0, 3));
    });
  }, []);

  useEffect(() => {
    if (mode === 'popup') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, mode]);

  const handleSend = (text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t) return;
    onSendMessage(t);
    setDraft('');
    setShowConvList(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (ctrlEnterRef.current) {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleSend(); }
      } else {
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); handleSend(); }
      }
    }
  };

  const isMini = mode === 'mini';
  const currentW = isMini ? Math.min(MINI_MAX_W, Math.max(MINI_MIN_W, size.w)) : size.w;
  const currentH = isMini ? MINI_H : size.h;

  const snapping = pos?.snapping ?? false;
  const snapTransition = 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)';
  const modeTransition = 'width 0.25s ease, height 0.25s ease';

  const popupStyle = pos
    ? {
        left: pos.left,
        top: pos.top,
        right: 'auto',
        bottom: 'auto',
        width: currentW,
        height: currentH,
        transition: snapping ? snapTransition : modeTransition,
      }
    : {
        width: currentW,
        height: currentH,
        transition: modeTransition,
      };

  // 8-direction resize handle configs: [dir, cursor]
  const HANDLES = [
    ['n', 'n-resize'],
    ['ne', 'ne-resize'],
    ['e', 'e-resize'],
    ['se', 'se-resize'],
    ['s', 's-resize'],
    ['sw', 'sw-resize'],
    ['w', 'w-resize'],
    ['nw', 'nw-resize'],
  ];

  // In mini mode only w/e handles are active
  const activeHandles = isMini
    ? HANDLES.filter(([d]) => d === 'w' || d === 'e')
    : HANDLES;

  return (
    <div ref={popupRef} className={`chat-popup chat-popup--${mode}`} style={popupStyle}>
      {/* 8-direction resize handles */}
      {activeHandles.map(([dir, cur]) => (
        <div
          key={dir}
          className={`chat-popup-rh chat-popup-rh--${dir}`}
          style={{ cursor: cur }}
          onPointerDown={(e) => handleResizePointerDown(e, dir)}
        />
      ))}

      {/* Header */}
      <div
        className="chat-popup-header"
        onPointerDown={handleHeaderPointerDown}
        style={{ cursor: 'grab' }}
      >
        <div className="chat-popup-header-left" onClick={isMini ? onMini : undefined} style={isMini ? { cursor: 'pointer', flex: 1 } : {}}>
          <span className="chat-popup-icon">✦</span>
          <span className={isMini ? 'chat-popup-mini-label' : 'chat-popup-conv-label'}>
            {activeConv ? activeConv.title : 'WaveAI'}
          </span>
        </div>
        <div className="chat-popup-header-actions" onClick={(e) => e.stopPropagation()}>
          {!isMini && (
            <button
              className={`chat-popup-action-btn${showConvList ? ' active' : ''}`}
              onClick={() => setShowConvList((v) => !v)}
              title="대화 목록"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <button className="chat-popup-action-btn" onClick={onMini} title={isMini ? '팝업으로 열기' : '한 줄로 접기'}>
            {isMini ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
          <button className="chat-popup-action-btn" onClick={onExpand} title="전체 화면으로 열기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button className="chat-popup-action-btn" onClick={onClose} title="닫기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body — only when popup mode */}
      {!isMini && (
        <>
          {showConvList ? (
            <div className="chat-popup-conv-panel">
              <button
                className="chat-popup-conv-new"
                onClick={() => { onAddConv(); setShowConvList(false); }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                새 대화
              </button>
              <div className="chat-popup-conv-scroll">
                {conversations.length === 0 && (
                  <p className="chat-popup-conv-empty">대화 내역이 없습니다</p>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`chat-popup-conv-row${conv.id === activeConvId ? ' active' : ''}`}
                    onClick={() => { onSelectConv(conv.id); setShowConvList(false); }}
                  >
                    {conv.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="chat-popup-messages">
                {isNewChat ? (
                  <div className="chat-popup-welcome">
                    <p className="chat-popup-welcome-hint">무엇이든 물어보세요</p>
                    {popupSuggestions.map((s) => (
                      <button
                        key={s.id || s.label}
                        className="chat-popup-suggestion"
                        onClick={() => handleSend(s.prompt)}
                      >
                        <span className="chat-popup-suggestion-icon">{s.icon}</span>
                        <span>{s.prompt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="chat-popup-bubble-list">
                    {messages.map((msg, i) => (
                      <div
                        key={msg.id || i}
                        className={`chat-popup-bubble-row ${msg.role}${i === messages.length - 1 ? ' is-new' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <span className="chat-popup-avatar">✦</span>
                        )}
                        <div className={`chat-popup-bubble ${msg.role}`}>
                          {msg.role === 'assistant' ? <MarkdownMessage text={msg.text} /> : msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="chat-popup-input-area">
                <form
                  className="chat-popup-input-form"
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                  <textarea
                    ref={textareaRef}
                    className="chat-popup-input"
                    rows={1}
                    placeholder="메시지를 입력하세요..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button type="submit" className="chat-send-btn" disabled={!draft.trim()} aria-label="보내기">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
