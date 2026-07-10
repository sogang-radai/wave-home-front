import { useState, useEffect } from 'react';
import { ChatMessages } from './ChatMessages';
import { ConversationList } from './ConversationList';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import './chat.css';

function ChatConvSidebar({
  open,
  onToggle,
  conversations,
  activeConvId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  showHeaderToggle,
}) {
  return (
    <aside className={`chat-conv-sidebar${open ? '' : ' collapsed'}`}>
      {showHeaderToggle && (
        <div className="chat-conv-header">
          <button
            type="button"
            className="chat-conv-toggle-btn"
            onClick={onToggle}
            title={open ? '목록 닫기' : '대화 목록 열기'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <ConversationList
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
        onRename={onRename}
      />
    </aside>
  );
}

export function ChatPage({
  conversations,
  activeConvId,
  onSelectConv,
  onAddConv,
  onDeleteConv,
  onRenameConv,
  onSendMessage,
  onShrink,
  waveTransition,
  initialDraft,
  onConsumeInitialDraft,
  mobileConvOpen = false,
  onMobileConvOpenChange,
}) {
  const isMobile = useMobileLayout();
  const [desktopConvOpen, setDesktopConvOpen] = useState(() => {
    try { return localStorage.getItem('chatConvOpen') !== 'false'; } catch { return true; }
  });
  const [chatEntered, setChatEntered] = useState(false);

  const convOpen = isMobile ? mobileConvOpen : desktopConvOpen;

  const setConvOpen = (next) => {
    if (isMobile) {
      onMobileConvOpenChange?.(typeof next === 'function' ? next(mobileConvOpen) : next);
      return;
    }
    setDesktopConvOpen((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem('chatConvOpen', String(value)); } catch {}
      return value;
    });
  };

  useEffect(() => {
    if (activeConvId) {
      setChatEntered(false);
      return undefined;
    }
    setChatEntered(false);
    const delay = waveTransition ? 620 : 80;
    const t = setTimeout(() => setChatEntered(true), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  const toggleConvOpen = () => setConvOpen((o) => !o);

  const handleSelectConv = (id) => {
    onSelectConv(id);
    if (isMobile) setConvOpen(false);
  };

  const handleAddConv = () => {
    onAddConv();
    if (isMobile) setConvOpen(false);
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConversation?.messages || [];
  const isNewChat = !activeConvId;

  const topbarLeft = !isMobile && !convOpen ? (
    <button type="button" className="chat-conv-toggle-btn" onClick={toggleConvOpen} title="대화 목록 열기">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  ) : null;

  const topbarRight = !isMobile && onShrink ? (
    <button type="button" className="chat-shrink-btn" onClick={onShrink}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="10" y1="14" x2="3" y2="21" />
        <line x1="21" y1="3" x2="14" y2="10" />
      </svg>
      작게 보기
    </button>
  ) : null;

  return (
    <div className="chat-page">
      <div className={`chat-page-body${isMobile ? ' chat-page-body--mobile' : ''}`}>
        {convOpen && <div className="chat-conv-overlay" onClick={() => setConvOpen(false)} />}
        <ChatConvSidebar
          open={convOpen}
          onToggle={toggleConvOpen}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={handleSelectConv}
          onAdd={handleAddConv}
          onDelete={onDeleteConv}
          onRename={onRenameConv}
          showHeaderToggle={!isMobile}
        />
        <ChatMessages
          messages={messages}
          isNewChat={isNewChat}
          chatEntered={chatEntered}
          onSend={onSendMessage}
          compact={false}
          topbarLeft={topbarLeft}
          topbarRight={topbarRight}
          waveTransition={waveTransition}
          initialDraft={initialDraft}
          onConsumeInitialDraft={onConsumeInitialDraft}
        />
      </div>
    </div>
  );
}
