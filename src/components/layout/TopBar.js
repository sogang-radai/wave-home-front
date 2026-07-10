import { useState } from 'react';
import { NotificationsPanel } from '../notifications/NotificationsPanel';
import { useMobileLayout } from '../../hooks/useMobileLayout';

export function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}
export function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function WaveSparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

export function ConvListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProfileMenu({ accounts, activeId, onSelect }) {
  return (
    <div className="profile-menu">
      <div className="profile-menu-head">
        <strong>계정 전환</strong>
      </div>
      {accounts.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`profile-menu-item ${item.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="mini-avatar">{item.name.charAt(0)}</span>
          <span className="profile-text">
            <strong>{item.name}</strong>
          </span>
          {item.id === activeId && <i>✓</i>}
        </button>
      ))}
    </div>
  );
}

export function TopActionsCluster({
  variant,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  notifications,
  onMarkAllNotificationsRead,
  accounts,
  account,
  onSwitchAccount,
  onOpenWaveAi,
  waveAiDisabled,
}) {
  const isMobile = useMobileLayout();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className={`top-actions top-actions-${variant}`}>
      {onOpenWaveAi && (
        <button
          className="wave-ai-trigger"
          aria-label="WaveAI"
          title={waveAiDisabled ? 'WaveAI 대화창이 이미 열려 있어요' : 'WaveAI 열기'}
          onClick={onOpenWaveAi}
          disabled={waveAiDisabled}
        >
          <WaveSparkIcon />
          <span>WaveAI</span>
        </button>
      )}
      <button className="bell" aria-label="알림" onClick={onToggleNotifications}>
        <BellIcon />
        {unreadCount > 0 && <b>{unreadCount}</b>}
      </button>
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          onClose={onCloseNotifications}
        />
      )}
      <button
        className={`profile profile-trigger${isMobile && variant === 'mobile' ? ' profile-trigger--hidden-mobile' : ''}`}
        aria-label="프로필 메뉴"
        onClick={() => setShowProfileMenu((value) => !value)}
      >
        <span className="mini-avatar">{account.name.charAt(0)}</span>
        <span className="profile-text">
          <strong>{account.name}</strong>
        </span>
      </button>
      {showProfileMenu && (
        <ProfileMenu
          accounts={accounts}
          activeId={account.id}
          onSelect={(id) => {
            onSwitchAccount(id);
            setShowProfileMenu(false);
          }}
        />
      )}
    </div>
  );
}

export function TopBar({
  title,
  isDemoMode = false,
  mobileNavOpen = false,
  onToggleMobileNav,
  showChatConvToggle = false,
  chatConvOpen = false,
  onToggleChatConv,
  ...actionProps
}) {
  return (
    <header className="topbar">
      <div className={`topbar-left${isDemoMode ? ' topbar-left--demo' : ''}`}>
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={mobileNavOpen}
          onClick={onToggleMobileNav}
        >
          <MenuIcon />
        </button>
        <h1 className="topbar-title">{title}</h1>
        {isDemoMode && (
          <span
            className="demo-mode-badge"
            role="status"
            title="시연 모드 — 날짜는 고정되며 변경 사항은 저장되지 않습니다."
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="8.01" />
              <line x1="12" y1="11" x2="12" y2="16" />
            </svg>
            <span className="demo-mode-badge-text">
              시연 모드 — 날짜 고정, 변경 사항 미저장
            </span>
          </span>
        )}
      </div>
      <TopActionsCluster variant="desktop" {...actionProps} />
      {showChatConvToggle ? (
        <div className="top-actions top-actions-mobile top-actions-mobile--chat">
          <span className="topbar-action-separator" aria-hidden="true" />
          <button
            type="button"
            className="chat-conv-toggle-btn chat-conv-toggle-btn--header"
            onClick={onToggleChatConv}
            title={chatConvOpen ? '대화 목록 닫기' : '대화 목록 열기'}
            aria-expanded={chatConvOpen}
            aria-label={chatConvOpen ? '대화 목록 닫기' : '대화 목록 열기'}
          >
            <ConvListIcon />
          </button>
        </div>
      ) : (
        <TopActionsCluster variant="mobile" {...actionProps} />
      )}
    </header>
  );
}
