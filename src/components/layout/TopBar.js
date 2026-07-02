import { useState } from 'react';
import { NotificationsPanel } from '../notifications/NotificationsPanel';

export function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
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
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className={`top-actions top-actions-${variant}`}>
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
        className="profile profile-trigger"
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

export function TopBar({ title, ...actionProps }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
      </div>
      <TopActionsCluster variant="desktop" {...actionProps} />
    </header>
  );
}
