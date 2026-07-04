import { useState, useEffect, useRef, useCallback } from 'react';
import chatApi from '../api/chatApi';
import { MarkdownMessage } from './MarkdownMessage';
import './chat.css';

const POPUP_MIN_W = 280;
const POPUP_MIN_H = 300;
const POPUP_MAX_W = 640;
const POPUP_MAX_H = 720;
const SNAP_MARGIN = 24;

export function ChatPopup({ mode, conversations, activeConvId, onSelectConv, onAddConv, onSendMessage, onExpand, onMini, onClose }) {
  const [draft, setDraft] = useState('');
  const [showConvList, setShowConvList] = useState(false);
  const messagesEndRef = useRef(null);
  const popupRef = useRef(null);

  // { left, top } in px; null = default CSS bottom-right corner
  const [pos, setPos] = useState(null);
  const [size, setSize] = useState({ w: 380, h: 520 });
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const snapToCorner = useCallback(() => {
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const snapLeft = cx < vw / 2;
    const snapTop = cy < vh / 2;
    const w = rect.width;
    const h = rect.height;
    setPos({
      left: snapLeft ? SNAP_MARGIN : vw - SNAP_MARGIN - w,
      top: snapTop ? SNAP_MARGIN : vh - SNAP_MARGIN - h,
      snapping: true,
    });
    setTimeout(() => setPos((p) => p ? { ...p, snapping: false } : p), 420);
  }, []);

  const handleHeaderPointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    if (mode === 'mini') return;
    e.preventDefault();
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    const onMove = (me) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      setPos({ left: dragRef.current.startLeft + dx, top: dragRef.current.startTop + dy, snapping: false });
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      snapToCorner();
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [mode, snapToCorner]);

  const handleResizePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;
    resizeRef.current = true;
    const onMove = (me) => {
      if (!resizeRef.current) return;
      setSize({
        w: Math.max(POPUP_MIN_W, Math.min(POPUP_MAX_W, startW + (me.clientX - startX))),
        h: Math.max(POPUP_MIN_H, Math.min(POPUP_MAX_H, startH + (me.clientY - startY))),
      });
    };
    const onUp = () => {
      resizeRef.current = false;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [size]);

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
  };

  const popupStyle = pos
    ? {
        left: pos.left,
        top: pos.top,
        right: 'auto',
        bottom: 'auto',
        width: size.w,
        height: mode === 'mini' ? 48 : size.h,
        transition: pos.snapping
          ? 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'width 0.22s ease, height 0.22s ease',
      }
    : {
        width: mode === 'popup' ? size.w : 320,
        height: mode === 'mini' ? 48 : size.h,
      };

  return (
    <div ref={popupRef} className={`chat-popup chat-popup--${mode}`} style={popupStyle}>
      {/* Header — click to toggle mini, drag to move */}
      <div
        className="chat-popup-header"
        onClick={mode === 'mini' ? onMini : undefined}
        style={mode === 'mini' ? { cursor: 'pointer' } : { cursor: 'grab' }}
        onPointerDown={handleHeaderPointerDown}
      >
        <div className="chat-popup-header-left">
          <span className="chat-popup-icon">✦</span>
          {mode === 'mini' ? (
            <span className="chat-popup-mini-label">
              {activeConv ? activeConv.title : 'WaveAI'}
            </span>
          ) : (
            <span className="chat-popup-conv-label">
              {activeConv ? activeConv.title : 'WaveAI'}
            </span>
          )}
        </div>
        <div className="chat-popup-header-actions" onClick={(e) => e.stopPropagation()}>
          {mode === 'popup' && (
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
          <button className="chat-popup-action-btn" onClick={onMini} title={mode === 'mini' ? '팝업으로 열기' : '한 줄로 접기'}>
            {mode === 'mini' ? (
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

      {/* Resize handle — bottom-right corner, popup mode only */}
      {mode === 'popup' && (
        <div className="chat-popup-resize-handle" onPointerDown={handleResizePointerDown} />
      )}

      {/* Body — only when popup mode */}
      {mode === 'popup' && (
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
                      <div key={msg.id || i} className={`chat-popup-bubble-row ${msg.role}`}>
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
                  <input
                    className="chat-popup-input"
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
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
