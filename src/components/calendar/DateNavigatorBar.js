import { useRef, useState } from 'react';
import { MonthCalendarPopup } from './MonthCalendarPopup';
import { formatDayLabel } from './calendarUtils';
import './calendar.css';

function NavChevron({ direction }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <polyline points={points} />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function DateNavigatorBar({
  mode = 'week',
  label,
  selectedDate,
  rangeStartDate,
  latestDate,
  onPrev,
  onNext,
  nextDisabled = false,
  showTodayReset = false,
  onTodayReset,
  onSelectDay,
  onSelectWeek,
  labelFading = false,
  className = '',
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const anchorRef = useRef(null);
  const displayLabel = mode === 'day' && selectedDate && latestDate
    ? formatDayLabel(selectedDate, latestDate)
    : label;

  return (
    <div className={`flex items-center justify-center relative ${className}`.trim()}>
      <div className="flex items-center gap-2 text-slate-600 font-medium">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          aria-label={mode === 'day' ? '이전 날' : '이전 주'}
        >
          <NavChevron direction="prev" />
        </button>
        <span
          className={`text-base font-semibold text-slate-800 min-w-[140px] text-center date-nav-display-label${labelFading ? ' is-fading' : ''}`}
        >
          {displayLabel}
        </span>
        <div className="relative" ref={anchorRef}>
          <button
            type="button"
            onClick={() => setShowCalendar((value) => !value)}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
            aria-label="달력 열기"
          >
            <CalendarIcon />
          </button>
          {showCalendar && (
            <MonthCalendarPopup
              mode={mode}
              anchorRef={anchorRef}
              selectedDate={selectedDate}
              rangeStartDate={rangeStartDate}
              latestDate={latestDate}
              onSelectDay={(date) => {
                onSelectDay?.(date);
                setShowCalendar(false);
              }}
              onSelectWeek={(date) => {
                onSelectWeek?.(date);
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
              className={mode === 'week' ? 'week-calendar-popup' : ''}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={mode === 'day' ? '다음 날' : '다음 주'}
        >
          <NavChevron direction="next" />
        </button>
      </div>
      {showTodayReset && onTodayReset && (
        <button
          type="button"
          onClick={onTodayReset}
          className="absolute right-0 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors date-nav-today-btn"
        >
          오늘로 이동
        </button>
      )}
    </div>
  );
}
