import { Fragment, useState } from 'react';
import './layout.css';
import logoDark from '../../img/logo_dark.png';
import logo from '../../img/logo.png';
import { pages, secondaryPages, upcomingFeatures } from '../../data/appData';
import { ChatBotIcon } from '../icons/ChatBotIcon';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import { SHOW_HOME_TWIN } from '../../api/config';

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
    return <ChatBotIcon />;
  }

  if (name === 'moon') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M18 2.75a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .53 1.28l-2.72 2.72H22a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.53-1.28l2.72-2.72zm-4.5 6a.75.75 0 0 1 0-1.5h3a.75.75 0 0 1 .53 1.28l-1.72 1.72h1.19a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.53-1.28l1.72-1.72z"
          clipRule="evenodd"
        />
        <path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" />
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
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19.836 10.486a.9.9 0 0 1-.21.47l-9.75 10.71a.94.94 0 0 1-.49.33q-.125.015-.25 0a1 1 0 0 1-.41-.09a.92.92 0 0 1-.45-.46a.9.9 0 0 1-.07-.58l.86-6.86h-3.63a1.7 1.7 0 0 1-.6-.15a1.29 1.29 0 0 1-.68-.99a1.3 1.3 0 0 1 .09-.62l3.78-9.45c.1-.239.266-.444.48-.59a1.3 1.3 0 0 1 .72-.21h7.24c.209.004.414.055.6.15c.188.105.349.253.47.43c.112.179.18.38.2.59a1.2 1.2 0 0 1-.1.61l-2.39 5.57h3.65a1 1 0 0 1 .51.16a1 1 0 0 1 .43 1z"
        />
      </svg>
    );
  }

  if (name === 'remote') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M5 13v9H3v-9Zm18 0v2h-2v7h-2v-7h-2v-2Zm-11-2a7.54 7.54 0 0 1 3.96 1.149l1.447-1.45A9.5 9.5 0 0 0 12 9a9.36 9.36 0 0 0-5.333 1.68l1.449 1.453A7.36 7.36 0 0 1 12 11" />
        <path fill="currentColor" d="M12 7a11.5 11.5 0 0 1 6.834 2.27l1.427-1.43A13.48 13.48 0 0 0 12 5a13.33 13.33 0 0 0-8.186 2.822l1.426 1.43A11.34 11.34 0 0 1 12 7" />
        <path fill="currentColor" d="M12 3a15.47 15.47 0 0 1 9.687 3.41l1.427-1.429A17.43 17.43 0 0 0 .96 4.964l1.427 1.429A15.33 15.33 0 0 1 12 3m0 10a4.5 4.5 0 1 0 4.5 4.5A4.5 4.5 0 0 0 12 13m0 7a2.5 2.5 0 1 1 2.5-2.5A2.5 2.5 0 0 1 12 20" />
      </svg>
    );
  }

  if (name === 'twin') {
    return (
      <svg {...common}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
        <path d="M9 21V12h6v9" />
      </svg>
    );
  }

  if (name === 'planner') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
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
    if (isDemoMode && item.id === 'posture') return false;
    return true;
  });

  const visibleSecondaryPages = secondaryPages.filter((item) => {
    if (item.id === 'twin' && !SHOW_HOME_TWIN) return false;
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
          className="brand-group brand-group--home"
          data-coachmark="nav-brand"
          aria-label="랜딩 페이지로 이동"
          onClick={handleShowLanding}
        >
          <span className="brand-mark">
            <img src={logoDark} alt="" className="brand-mark-img brand-mark-img--default" />
            <img src={logo} alt="" className="brand-mark-img brand-mark-img--hover" />
          </span>
          <div className="brand-text">
            <strong>WaveHome</strong>
            <span>Your Lifestyle Agent</span>
          </div>
        </button>
        <button className="collapse-button" aria-label="collapse sidebar" onClick={() => onCollapsedChange((value) => !value)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="nav-list">
        {visiblePages.map((item) => (
          <Fragment key={item.id}>
            {item.id === 'sleep' && <div className="nav-divider" role="separator" />}
            <button
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              data-coachmark={`nav-${item.id}`}
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
              <span className="nav-label">{item.label}</span>
              {page === item.id && <i />}
            </button>
          </Fragment>
        ))}

        {visibleSecondaryPages.length > 0 && (
          <>
            <div className="nav-divider" role="separator" />
            {visibleSecondaryPages.map((item) => (
              <button
                key={item.id}
                className={`nav-item nav-item--compact ${page === item.id ? 'active' : ''}`}
                data-coachmark={`nav-${item.id}`}
                onClick={() => {
                  handleSelect(item.id);
                  if (collapsed) onCollapsedChange(false);
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon"><SidebarIcon name={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
                {page === item.id && <i />}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="nav-upcoming">
        <p className="nav-upcoming-title">확장 예정 기능</p>
        {upcomingFeatures.map((feature) => (
          <div className="nav-item nav-item--upcoming" key={feature.id}>
            <span className="nav-label">
              <span>{feature.label}</span>
              <span className="nav-info" tabIndex={0}>
                <span className="nav-info-icon" aria-hidden="true">ⓘ</span>
                <span className="nav-info-tooltip" role="tooltip">{feature.description}</span>
              </span>
            </span>
          </div>
        ))}
      </div>

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
