import { useState } from 'react';

export function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

export function formatStatusDateLabel(date, latestDate) {
  if (isSameDay(date, latestDate)) return '오늘';
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function getToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function CalendarPopup({ selectedDate, latestDate, onSelect }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [...Array(startWeekday).fill(null), ...Array(daysInMonth).keys()].map((d) =>
    d === null ? null : d + 1
  );

  return (
    <div className="calendar-popup">
      <div className="calendar-popup-head">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="이전 달">
          ‹
        </button>
        <strong>{year}년 {month + 1}월</strong>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="calendar-popup-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-popup-grid">
        {cells.map((d, index) => {
          if (d === null) return <span key={`blank-${index}`} />;
          const cellDate = new Date(year, month, d);
          const isSelected = isSameDay(cellDate, selectedDate);
          const isDisabled = cellDate > latestDate;
          return (
            <button
              type="button"
              key={d}
              className={isSelected ? 'selected' : ''}
              disabled={isDisabled}
              onClick={() => onSelect(cellDate)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StatusDateNavigator({ date, latestDate, onChange }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const shiftDay = (delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onChange(next);
  };

  return (
    <div className="date-navigator">
      <button type="button" onClick={() => shiftDay(-1)} aria-label="이전 날">‹</button>
      <button type="button" className="date-navigator-label" onClick={() => setShowCalendar((value) => !value)}>
        {formatStatusDateLabel(date, latestDate)}
      </button>
      <button type="button" onClick={() => shiftDay(1)} aria-label="다음 날" disabled={isSameDay(date, latestDate)}>
        ›
      </button>
      {showCalendar && (
        <CalendarPopup
          selectedDate={date}
          latestDate={latestDate}
          onSelect={(value) => {
            onChange(value);
            setShowCalendar(false);
          }}
        />
      )}
    </div>
  );
}
