import { Fragment, useRef } from 'react';
import './layout.css';
import logo from '../../img/logo.png';
import { pages } from '../../data/appData';
import { TopActionsCluster } from './TopBar';

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
    return (
      <svg width="24" height="24" viewBox="35 98 345 228" fill="currentColor" aria-hidden="true">
        <g transform="translate(0,443) scale(0.1,-0.1)">
          <path d="M796 3316 c-43 -123 -81 -228 -85 -233 -3 -5 -108 -45 -233 -89 -125 -43 -221 -82 -215 -85 7 -3 106 -39 222 -79 116 -40 215 -78 222 -84 6 -6 46 -111 89 -234 42 -122 79 -221 81 -219 3 4 77 211 130 367 14 41 29 79 33 84 5 4 108 44 231 87 122 43 223 80 225 82 2 1 -99 38 -224 81 -125 44 -228 80 -230 81 -1 1 -36 96 -77 211 -40 115 -77 219 -82 231 -7 18 -23 -20 -87 -201z m122 -211 l39 -110 112 -39 c61 -22 108 -43 104 -47 -5 -3 -52 -21 -105 -38 -53 -18 -101 -38 -107 -45 -7 -8 -24 -52 -40 -99 -45 -133 -43 -133 -87 -7 l-40 112 -108 38 c-59 21 -109 40 -111 42 -2 2 46 22 108 43 l112 40 39 113 c21 62 40 111 42 110 2 -2 21 -53 42 -113z" />
          <path d="M2740 2874 c-189 -37 -343 -110 -460 -221 -94 -88 -98 -94 -416 -622 -211 -351 -259 -424 -315 -480 -148 -147 -301 -201 -574 -201 -71 0 -174 -3 -228 -7 l-97 -6 0 -128 0 -126 1730 0 1730 0 0 122 0 122 -209 0 c-229 0 -336 13 -447 55 -134 51 -261 147 -335 256 -41 61 -89 188 -89 236 0 88 71 184 158 213 53 17 140 3 215 -36 56 -29 147 -54 197 -54 48 0 100 28 128 70 21 31 23 43 19 100 -8 99 -40 182 -115 294 -37 56 -74 114 -82 129 -8 16 -37 47 -65 70 -27 23 -52 44 -55 47 -42 44 -164 102 -290 137 -67 19 -115 25 -230 28 -80 2 -156 1 -170 -1z m351 -222 c186 -56 309 -155 389 -314 22 -45 38 -83 36 -85 -2 -3 -27 13 -55 36 -112 88 -279 140 -408 127 -299 -31 -555 -261 -609 -547 -28 -144 4 -321 68 -379 61 -56 199 -110 315 -123 l42 -5 -70 70 c-99 100 -141 189 -147 307 -5 109 12 175 70 261 54 81 198 191 198 151 0 -5 -6 -11 -13 -14 -17 -6 -54 -83 -74 -152 -29 -95 -2 -256 63 -386 48 -97 148 -211 252 -287 l64 -47 -74 -6 c-63 -5 -79 -3 -118 16 -36 19 -68 24 -165 29 -170 8 -242 32 -381 127 -110 76 -188 187 -287 408 l-24 53 -27 -43 c-15 -24 -45 -72 -67 -107 -21 -34 -39 -66 -39 -70 0 -16 50 -112 94 -180 25 -38 84 -106 131 -149 47 -44 85 -82 85 -84 0 -2 -182 -4 -405 -4 -223 0 -405 2 -405 5 0 3 29 26 64 52 35 26 94 80 131 120 68 74 93 113 462 727 87 145 175 283 197 308 81 92 213 167 350 198 85 20 270 13 357 -13z" />
          <path d="M1402 2580 l-34 -140 -36 -9 c-20 -6 -81 -20 -135 -32 -54 -13 -92 -25 -85 -29 7 -4 68 -19 135 -35 l122 -29 33 -140 33 -140 34 141 34 140 121 28 c67 15 127 31 134 35 7 4 -43 20 -113 36 -69 15 -130 31 -134 34 -5 3 -24 67 -42 142 l-34 137 -33 -139z m52 -126 c12 -47 14 -49 66 -64 60 -17 58 -24 -8 -35 -24 -4 -45 -12 -47 -18 -2 -7 -10 -34 -17 -62 l-14 -50 -15 60 -14 60 -47 10 c-66 14 -67 22 -5 35 l54 13 13 54 c6 30 14 52 17 50 2 -3 10 -27 17 -53z" />
        </g>
      </svg>
    );
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
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  notifications,
  onMarkAllNotificationsRead,
  accounts,
  account,
  onSwitchAccount,
  collapsed,
  onCollapsedChange,
  onUnlockDevMenu,
}) {
  // Five rapid clicks on the logo unlocks the hidden developer menu. State resets on page refresh.
  const devClickRef = useRef({ count: 0, last: 0 });
  const handleLogoClick = () => {
    const now = Date.now();
    const state = devClickRef.current;
    state.count = now - state.last < 400 ? state.count + 1 : 1;
    state.last = now;
    if (state.count >= 5) {
      state.count = 0;
      onUnlockDevMenu?.();
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark dev-unlock-target" onClick={handleLogoClick}>
          <img src={logo} alt="WaveHome" />
        </div>
        <div className="brand-text">
          <strong>WaveHome</strong>
          <span>Your Health Agent</span>
        </div>
        <button className="collapse-button" aria-label="collapse sidebar" onClick={() => onCollapsedChange((value) => !value)}>
          {collapsed ? '›' : '‹'}
        </button>
        <TopActionsCluster
          variant="mobile"
          showNotifications={showNotifications}
          onToggleNotifications={onToggleNotifications}
          onCloseNotifications={onCloseNotifications}
          notifications={notifications}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          accounts={accounts}
          account={account}
          onSwitchAccount={onSwitchAccount}
        />
      </div>

      <nav className="nav-list">
        {pages.map((item) => (
          <Fragment key={item.id}>
            <button
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'chat') {
                  onNavigateToChat?.();
                } else {
                  onSelect(item.id);
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
      </nav>

      <div className="sidebar-bottom">
        <p className="sidebar-date">{today}</p>
        <button
          className={`nav-item bottom-setting ${page === 'setting' ? 'active' : ''}`}
          onClick={() => onSelect('setting')}
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
