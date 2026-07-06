import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildMonthCalendarCells,
  getToday,
  isInForwardWeek,
  isSameDay,
  normalizeDate,
} from './calendarUtils';
import '../report/report.css';
import './calendar.css';

const POPUP_EST_HEIGHT = 360;

function usePopupPosition(anchorRef, open, mode) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef?.current) {
      setPosition(null);
      return undefined;
    }

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = mode !== 'week' && spaceBelow < POPUP_EST_HEIGHT + 16;
      const top = openAbove
        ? Math.max(12, rect.top - POPUP_EST_HEIGHT - 8)
        : rect.bottom + 8;

      setPosition({
        top,
        left: rect.left + rect.width / 2,
        placement: openAbove ? 'above' : 'below',
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open, mode]);

  return position;
}

export function MonthCalendarPopup({
  mode = 'week',
  anchorRef,
  selectedDate,
  rangeStartDate,
  latestDate,
  onSelectDay,
  onSelectWeek,
  onClose,
  className = '',
}) {
  const today = getToday();
  const popupRef = useRef(null);
  const [viewDate, setViewDate] = useState(new Date(selectedDate || rangeStartDate || today));
  const [hoverDate, setHoverDate] = useState(null);
  const [slideDir, setSlideDir] = useState(0);
  const wheelLock = useRef(false);
  const position = usePopupPosition(anchorRef, true, mode);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthCalendarCells(viewDate);
  const isWeekMode = mode === 'week';
  const rangeAnchor = rangeStartDate || selectedDate;

  useEffect(() => {
    const anchor = selectedDate || rangeStartDate || today;
    setViewDate(new Date(anchor));
  }, [selectedDate, rangeStartDate, today]);

  useEffect(() => {
    document.body.classList.add('calendar-modal-open');
    return () => document.body.classList.remove('calendar-modal-open');
  }, []);

  const shiftMonth = useCallback((delta) => {
    if (wheelLock.current) return;
    wheelLock.current = true;
    setSlideDir(delta);
    window.setTimeout(() => {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
      setSlideDir(0);
      wheelLock.current = false;
    }, 180);
  }, []);

  useEffect(() => {
    const node = popupRef.current;
    if (!node) return undefined;

    const onWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (wheelLock.current || Math.abs(event.deltaY) < 8) return;
      shiftMonth(event.deltaY > 0 ? 1 : -1);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [shiftMonth, position]);

  if (!position) return null;

  const popup = (
    <div className="calendar-modal-root" role="dialog" aria-modal="true" aria-label="날짜 선택">
      <div className="calendar-popup-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={popupRef}
        className={`calendar-popup month-calendar-popup ${className}${position.placement === 'above' ? ' placement-above' : ' placement-below'}`.trim()}
        style={{ top: position.top, left: position.left }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="calendar-popup-head">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="이전 달">‹</button>
          <strong>{year}년 {month + 1}월</strong>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="다음 달">›</button>
        </div>
        <div className="calendar-popup-weekdays">
          {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className={`calendar-popup-grid${slideDir < 0 ? ' slide-from-left' : ''}${slideDir > 0 ? ' slide-from-right' : ''}`}>
          {cells.map(({ date: cellDate, inMonth }, index) => {
            const normalized = normalizeDate(cellDate);
            const isToday = isSameDay(normalized, today);
            const isSelected = !isWeekMode && selectedDate && isSameDay(normalized, selectedDate);
            const isDisabled = !isWeekMode && latestDate && normalized > normalizeDate(latestDate);
            const inActiveRange = isWeekMode && rangeAnchor && isInForwardWeek(rangeAnchor, normalized);
            const inHoverRange = isWeekMode
              ? hoverDate && isInForwardWeek(hoverDate, normalized)
              : hoverDate && isSameDay(hoverDate, normalized);

            return (
              <button
                type="button"
                key={`${normalized.toISOString()}-${index}`}
                className={[
                  isToday ? 'is-today' : '',
                  isSelected ? 'is-selected' : '',
                  inActiveRange ? 'range-active' : '',
                  inHoverRange ? 'is-hover' : '',
                  inMonth ? '' : 'muted-day',
                ].filter(Boolean).join(' ')}
                disabled={isDisabled}
                onMouseEnter={() => setHoverDate(normalized)}
                onMouseLeave={() => setHoverDate(null)}
                onClick={() => {
                  if (isWeekMode) {
                    onSelectWeek(normalizeDate(normalized));
                  } else {
                    onSelectDay(normalizeDate(normalized));
                  }
                  onClose();
                }}
                aria-label={`${normalized.getMonth() + 1}월 ${normalized.getDate()}일`}
              >
                {normalized.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
