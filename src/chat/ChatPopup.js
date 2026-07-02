import { useState, useEffect, useRef } from 'react';
import chatApi from '../api/chatApi';
import { MarkdownMessage } from './MarkdownMessage';
import './chat.css';

export function ChatPopup({ mode, conversations, activeConvId, onSelectConv, onAddConv, onSendMessage, onExpand, onMini, onClose }) {
  const [draft, setDraft] = useState('');
  const [showConvList, setShowConvList] = useState(false);
  const messagesEndRef = useRef(null);

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

  return (
    <div className={`chat-popup chat-popup--${mode}`}>
      {/* Header */}
      <div
        className="chat-popup-header"
        onClick={mode === 'mini' ? onMini : undefined}
        style={mode === 'mini' ? { cursor: 'pointer' } : undefined}
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
