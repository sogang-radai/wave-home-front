import { useRef, useState } from 'react';
import { MonthCalendarPopup } from './MonthCalendarPopup';
import { formatDayLabel } from './calendarUtils';
import './calendar.css';

function NavChevron({ direction, double = false }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  if (!double) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
        <polyline points={points} />
      </svg>
    );
  }
  const second = direction === 'prev' ? '21 18 15 12 21 6' : '3 18 9 12 3 6';
  return (
    <svg width="18" height="16" viewBox="0 0 28 24" fill="none" stroke="#64748b" strokeWidth="2">
      <polyline points={points} />
      <polyline points={second} />
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

const navBtnClass = 'p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed';

export function DateNavigatorBar({
  mode = 'week',
  label,
  selectedDate,
  rangeStartDate,
  latestDate,
  onPrev,
  onNext,
  onPrevDay,
  onPrevWeek,
  onNextWeek,
  onNextDay,
  nextDisabled = false,
  nextDayDisabled = false,
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

  const useQuadNav = mode === 'week' && onPrevDay && onPrevWeek && onNextWeek && onNextDay;

  return (
    <div className={`flex items-center justify-center relative ${className}`.trim()}>
      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
        {useQuadNav ? (
          <>
            <button type="button" onClick={onPrevDay} className={navBtnClass} aria-label="이전 날">
              <NavChevron direction="prev" />
            </button>
            <button type="button" onClick={onPrevWeek} className={navBtnClass} aria-label="이전 주">
              <NavChevron direction="prev" double />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPrev}
            className={navBtnClass}
            aria-label={mode === 'day' ? '이전 날' : '이전 주'}
          >
            <NavChevron direction="prev" />
          </button>
        )}

        <div className="relative date-nav-calendar-trigger" ref={anchorRef}>
          <button
            type="button"
            onClick={() => setShowCalendar((value) => !value)}
            className={navBtnClass}
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

        <span
          className={`text-base font-semibold text-slate-800 min-w-[140px] text-center date-nav-display-label${labelFading ? ' is-fading' : ''}`}
        >
          {displayLabel}
        </span>

        {useQuadNav ? (
          <>
            <button type="button" onClick={onNextWeek} className={navBtnClass} aria-label="다음 주">
              <NavChevron direction="next" double />
            </button>
            <button
              type="button"
              onClick={onNextDay}
              disabled={nextDayDisabled}
              className={navBtnClass}
              aria-label="다음 날"
            >
              <NavChevron direction="next" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={navBtnClass}
            aria-label={mode === 'day' ? '다음 날' : '다음 주'}
          >
            <NavChevron direction="next" />
          </button>
        )}
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
