import { Fragment, useState } from 'react';
import './layout.css';
import logo from '../../img/logo_dark.png';
import { pages } from '../../data/appData';
import { SHOW_HOME_TWIN } from '../../api/config';
import { WaveAiIcon } from '../icons/WaveAiIcon';
import { useMobileLayout } from '../../hooks/useMobileLayout';

function SidebarIcon({ name }) {
  const common = {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    );
  }

  if (name === 'waveai') {
    return <WaveAiIcon />;
  }

  if (name === 'moon') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" d="m21.067 11.857l-.642-.388zm-8.924-8.924l-.388-.642zM21.25 12A9.25 9.25 0 0 1 12 21.25v1.5c5.937 0 10.75-4.813 10.75-10.75zM12 21.25A9.25 9.25 0 0 1 2.75 12h-1.5c0 5.937 4.813 10.75 10.75 10.75zM2.75 12A9.25 9.25 0 0 1 12 2.75v-1.5C6.063 1.25 1.25 6.063 1.25 12zm12.75 2.25A5.75 5.75 0 0 1 9.75 8.5h-1.5a7.25 7.25 0 0 0 7.25 7.25zm4.925-2.781A5.75 5.75 0 0 1 15.5 14.25v1.5a7.25 7.25 0 0 0 6.21-3.505zM9.75 8.5a5.75 5.75 0 0 1 2.781-4.925l-.776-1.284A7.25 7.25 0 0 0 8.25 8.5zM12 2.75a.38.38 0 0 1-.268-.118a.3.3 0 0 1-.082-.155c-.004-.031-.002-.121.105-.186l.776 1.284c.503-.304.665-.861.606-1.299c-.062-.455-.42-1.026-1.137-1.026zm9.71 9.495c-.066.107-.156.109-.187.105a.3.3 0 0 1-.155-.082a.38.38 0 0 1-.118-.268h1.5c0-.717-.571-1.075-1.026-1.137c-.438-.059-.995.103-1.299.606z" />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg {...common}>
        <path d="M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
      </svg>
    );
  }

  if (name === 'alarm') {
    return (
      <svg {...common}>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
        <path d="M5 3 2 6" />
        <path d="M22 6 19 3" />
      </svg>
    );
  }

  if (name === 'posture') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6.5 21l3.5 -5" />
        <path d="M5 11l7 -2" />
        <path d="M16 21l-4 -7v-5l7 -4" />
        <path d="M9.007 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      </svg>
    );
  }

  if (name === 'lightning') {
    return (
      <svg {...common}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  if (name === 'homeTwin') {
    return (
      <svg {...common}>
        <path d="M5 12H3l9-9l9 9h-2M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
      </svg>
    );
  }

  if (name === 'remote') {
    return (
      <svg {...common}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12H3l9-9l9 9h-2M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
    </svg>
  );
}

export function Sidebar({
  page,
  onSelect,
  onNavigateToChat,
  today,
  collapsed,
  onCollapsedChange,
  isDemoMode = false,
  mobileOpen = false,
  onMobileClose,
  onShowLanding,
  accounts = [],
  account,
  onSwitchAccount,
}) {
  const isMobile = useMobileLayout();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const visiblePages = pages.filter((item) => {
    if (item.id === 'homeTwin') return SHOW_HOME_TWIN;
    if (isDemoMode && item.id === 'posture') return false;
    return true;
  });

  const handleSelect = (id) => {
    onSelect(id);
    onMobileClose?.();
  };

  const handleNavigateToChat = () => {
    onNavigateToChat?.();
    onMobileClose?.();
  };

  const handleShowLanding = () => {
    onShowLanding?.();
    onMobileClose?.();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand">
        <button
          type="button"
          className="brand-mark brand-mark--home"
          aria-label="랜딩 페이지로 이동"
          onClick={handleShowLanding}
        >
          <img src={logo} alt="" />
        </button>
        <div className="brand-text">
          <strong>WaveHome</strong>
          <span>Your Lifestyle Agent</span>
        </div>
        <button className="collapse-button" aria-label="collapse sidebar" onClick={() => onCollapsedChange((value) => !value)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="nav-list">
        {visiblePages.map((item) => (
          <Fragment key={item.id}>
            <button
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'chat') {
                  handleNavigateToChat();
                } else {
                  handleSelect(item.id);
                }
                if (collapsed) onCollapsedChange(false);
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon"><SidebarIcon name={item.icon} /></span>
              <span className="nav-label">
                {item.label}
                {item.id === 'homeTwin' && isDemoMode && (
                  <span className="nav-demo-tag">demo</span>
                )}
              </span>
              {page === item.id && <i />}
            </button>
          </Fragment>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <p className="sidebar-date">{today}</p>
        {isMobile && accounts.length > 0 && account && (
          <div className="sidebar-account-mobile">
            <button
              type="button"
              className="sidebar-account-trigger"
              aria-expanded={showAccountMenu}
              onClick={() => setShowAccountMenu((value) => !value)}
            >
              <span className="mini-avatar">{account.name.charAt(0)}</span>
              <span className="profile-text">
                <strong>{account.name}</strong>
                <span>계정 전환</span>
              </span>
            </button>
            {showAccountMenu && (
              <div className="sidebar-account-menu">
                {accounts.filter(Boolean).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`sidebar-account-item${item.id === account.id ? ' active' : ''}`}
                    onClick={() => {
                      onSwitchAccount?.(item.id);
                      setShowAccountMenu(false);
                      onMobileClose?.();
                    }}
                  >
                    <span className="mini-avatar">{item.name?.charAt(0) || '?'}</span>
                    <span className="profile-text">
                      <strong>{item.name}</strong>
                    </span>
                    {item.id === account.id && <i>✓</i>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          className={`nav-item bottom-setting ${page === 'setting' ? 'active' : ''}`}
          onClick={() => handleSelect('setting')}
          title={collapsed ? 'Setting' : undefined}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M0 0h24v24H0z" fill="none" />
              <path fill="currentColor" d="M10.825 22q-.675 0-1.162-.45t-.588-1.1L8.85 18.8q-.325-.125-.612-.3t-.563-.375l-1.55.65q-.625.275-1.25.05t-.975-.8l-1.175-2.05q-.35-.575-.2-1.225t.675-1.075l1.325-1Q4.5 12.5 4.5 12.337v-.675q0-.162.025-.337l-1.325-1Q2.675 9.9 2.525 9.25t.2-1.225L3.9 5.975q.35-.575.975-.8t1.25.05l1.55.65q.275-.2.575-.375t.6-.3l.225-1.65q.1-.65.588-1.1T10.825 2h2.35q.675 0 1.163.45t.587 1.1l.225 1.65q.325.125.613.3t.562.375l1.55-.65q.625-.275 1.25-.05t.975.8l1.175 2.05q.35.575.2 1.225t-.675 1.075l-1.325 1q.025.175.025.338v.674q0 .163-.05.338l1.325 1q.525.425.675 1.075t-.2 1.225l-1.2 2.05q-.35.575-.975.8t-1.25-.05l-1.5-.65q-.275.2-.575.375t-.6.3l-.225 1.65q-.1.65-.587 1.1t-1.163.45zm1.225-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5" />
            </svg>
          </span>
          <span className="nav-label">설정</span>
          {page === 'setting' && <i />}
        </button>
      </div>
    </aside>
  );
}
