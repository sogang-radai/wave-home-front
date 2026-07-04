import { useState, useRef, useEffect, useCallback } from 'react';
import chatApi from '../api/chatApi';
import settingsApi from '../api/settingsApi';
import { MarkdownMessage } from './MarkdownMessage';
import './chat.css';

function PencilWriteIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChatConvSidebar({ open, onToggle, conversations, activeConvId, onSelect, onAdd, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conv, e) => {
    e?.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  return (
    <aside className={`chat-conv-sidebar${open ? '' : ' collapsed'}`}>
      <div className="chat-conv-header">
        <button
          className="chat-conv-toggle-btn"
          onClick={onToggle}
          title={open ? '목록 닫기' : '대화 목록 열기'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="chat-conv-list">
        {/* New conversation button at top */}
        <button className="chat-conv-new-row" onClick={onAdd}>
          <PencilWriteIcon />
          <span>새 대화</span>
        </button>
        <hr className="chat-conv-separator" />

        {conversations.length === 0 && (
          <p className="chat-conv-empty">대화 내역이 없습니다</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`chat-conv-item${conv.id === activeConvId ? ' active' : ''}`}
            onClick={() => editingId !== conv.id && onSelect(conv.id)}
          >
            {editingId === conv.id ? (
              <input
                className="chat-conv-edit-input"
                value={editTitle}
                autoFocus
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {/* Clicking the title text triggers inline rename */}
                <span
                  className="chat-conv-title"
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(conv); }}
                  title="클릭하여 이름 변경"
                >
                  {conv.title}
                </span>
                <div className="chat-conv-actions">
                  <button
                    className="chat-conv-action-btn danger"
                    title="삭제"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function useAutoResizeTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);
  return ref;
}

function ChatMainArea({ messages, isNewChat, onSend, onShrink, onToggleConv, convOpen, chatEntered }) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);
  const ctrlEnterRef = useRef(false);
  const textareaRef = useAutoResizeTextarea(draft);

  const [shownSuggestions, setShownSuggestions] = useState([]);
  useEffect(() => {
    chatApi.getSuggestions().then((res) => {
      setShownSuggestions([...res.suggestionPool].sort(() => Math.random() - 0.5).slice(0, 4));
    });
    settingsApi.getAiAgentSettings().then((s) => {
      ctrlEnterRef.current = s.ctrlEnterSend ?? false;
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback((text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    // Reset textarea height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [draft, onSend, textareaRef]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (ctrlEnterRef.current) {
        // ctrlEnterSend=true: Ctrl+Enter → send, plain Enter → newline
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleSend(); }
      } else {
        // ctrlEnterSend=false (default): plain Enter → send, Ctrl+Enter → newline
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); handleSend(); }
      }
    }
  };

  return (
    <div className="chat-main-area">
      <div className="chat-main-topbar">
        {onToggleConv && !convOpen && (
          <button
            className="chat-conv-toggle-btn"
            onClick={onToggleConv}
            title="대화 목록 열기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {onShrink && (
          <button className="chat-shrink-btn" onClick={onShrink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
            </svg>
            작게 보기
          </button>
        )}
      </div>
      <div className="chat-messages-area">
        {isNewChat ? (
          <div className={`chat-welcome${chatEntered ? ' chat-welcome--entered' : ''}`}>
            <div className="chat-welcome-icon">✦</div>
            <h2 className="chat-welcome-title">WaveAI에게 무엇이든 물어보세요</h2>
            <p className="chat-welcome-sub">수면·자세·심박·가전까지, 건강 데이터 기반으로 답변드려요</p>
            <div className="chat-suggestions-grid">
              {shownSuggestions.map((s, idx) => (
                <button
                  key={s.id || s.label}
                  className={`chat-suggestion-card${chatEntered ? ' chat-suggestion-card--entered' : ''}`}
                  style={{ '--card-idx': idx }}
                  onClick={() => handleSend(s.prompt)}
                >
                  <span className="chat-suggestion-icon">{s.icon}</span>
                  <strong>{s.label}</strong>
                  <span>{s.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-bubble-list">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`chat-bubble-row ${msg.role}${i === messages.length - 1 ? ' is-new' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-bubble-avatar">✦</div>
                )}
                <div className={`chat-bubble ${msg.role}${msg.status === 'streaming' ? ' streaming' : ''}`}>
                  {/* Tool event pills */}
                  {msg.toolEvents?.length > 0 && (
                    <div className="chat-tool-pills">
                      {msg.toolEvents.map((te, ti) => (
                        <span key={ti} className={`chat-tool-pill${te.status === 'done' ? ' done' : ''}`}>
                          {te.status === 'done' ? '✓' : '⚙'}
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
                        <span className="chat-streaming-dots" />
                      )}
                    </>
                  ) : msg.text}
                  {msg.status === 'streaming' && msg.text && (
                    <span className="chat-cursor-blink" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form
          className="chat-input-form"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder="메시지를 입력하세요..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="chat-send-btn" aria-label="보내기" disabled={!draft.trim()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export function ChatPage({ conversations, activeConvId, onSelectConv, onAddConv, onDeleteConv, onRenameConv, onSendMessage, onShrink, waveTransition, sidebarWidth }) {
  const [convOpen, setConvOpen] = useState(() => {
    try { return localStorage.getItem('chatConvOpen') !== 'false'; } catch { return true; }
  });
  // chatEntered drives the welcome screen slide-up/fade-in animation
  const [chatEntered, setChatEntered] = useState(false);

  useEffect(() => {
    // Trigger enter animation shortly after mount (or when wave transition finishes)
    const delay = waveTransition ? 600 : 80;
    const t = setTimeout(() => setChatEntered(true), delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleConvOpen = () => setConvOpen((o) => {
    const next = !o;
    try { localStorage.setItem('chatConvOpen', String(next)); } catch {}
    return next;
  });
  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConversation?.messages || [];

  return (
    <div className="chat-page">
      <div className="chat-page-body">
        {convOpen && <div className="chat-conv-overlay" onClick={() => setConvOpen(false)} />}
        <ChatConvSidebar
          open={convOpen}
          onToggle={toggleConvOpen}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={onSelectConv}
          onAdd={onAddConv}
          onDelete={onDeleteConv}
          onRename={onRenameConv}
        />
        <ChatMainArea
          messages={messages}
          isNewChat={!activeConvId || messages.length === 0}
          onSend={onSendMessage}
          onShrink={onShrink}
          onToggleConv={toggleConvOpen}
          convOpen={convOpen}
          chatEntered={chatEntered}
        />
      </div>
    </div>
  );
}
