import './notifications.css';

export function CheckCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 4 4L17 5" />
      <path d="m9 11 4 4L23 5" />
    </svg>
  );
}

export function NotificationTypeIcon({ type }) {
  const common = {
    width: '13',
    height: '13',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'var(--ink)',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (type === 'sleep') {
    return (
      <svg {...common}>
        <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a7 7 0 1 0 11.5 11.5Z" />
      </svg>
    );
  }

  if (type === 'posture') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (type === 'temperature') {
    return (
      <svg {...common}>
        <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="12" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

export function NotificationsPanel({ notifications, onMarkAllRead, onClose }) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="notifications-panel relative z-20">
        <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>알림</p>
            {unreadCount > 0 && (
              <p className="text-xs" style={{ color: 'var(--sub)' }}>읽지 않은 알림 {unreadCount}개</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--wave-10)]"
                style={{ color: 'var(--ink)' }}
              >
                <CheckCheckIcon />
                모두 읽음
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="알림 닫기"
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-[var(--wave-10)]"
              style={{ color: 'var(--sub)' }}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((item) => (
            <div className="flex items-start gap-3 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }} key={item.id}>
              <div className="relative mt-0.5 shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: item.read ? 'var(--wave-10)' : 'var(--wave-20)' }}
                >
                  <NotificationTypeIcon type={item.type} />
                </div>
                {!item.read && (
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: 'var(--danger)' }} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs leading-snug ${item.read ? '' : 'font-semibold'}`} style={{ color: 'var(--ink)' }}>
                  {item.msg}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--sub)' }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
