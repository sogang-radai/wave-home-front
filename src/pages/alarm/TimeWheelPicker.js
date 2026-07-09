import {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';

const ITEM_H = 44;
const DEFAULT_VISIBLE = 5;
const REPEAT = 11;
const WHEEL_LINE_HEIGHT_PX = 16;
const SETTLE_DEBOUNCE_MS = 100;
/** Mouse-wheel ticks are ~100–120px; treat as one detent, not N row heights. */
const COARSE_WHEEL_MIN_PX = 48;
const COARSE_WHEEL_COOLDOWN_MS = 90;
const FINE_WHEEL_THRESHOLD_RATIO = 0.42;

const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

function normalizeWheelDeltaY(e, itemHeight) {
  if (e.deltaMode === 1) return e.deltaY * WHEEL_LINE_HEIGHT_PX;
  if (e.deltaMode === 2) return e.deltaY * itemHeight;
  return e.deltaY;
}

const WheelColumn = forwardRef(function WheelColumn({
  items, value, onSettle, className = '', itemHeight = ITEM_H, visibleRows = DEFAULT_VISIBLE,
}, ref) {
  const containerRef = useRef(null);
  const settleTimer = useRef(null);
  const programmatic = useRef(false);
  const wheelAccumRef = useRef(0);
  const coarseWheelAtRef = useRef(0);
  const lastEmitted = useRef(value);
  const scrollIdxRef = useRef(null);
  const absIdxRef = useRef(null);
  const valueRef = useRef(value);
  const onSettleRef = useRef(onSettle);
  const [scrollValue, setScrollValue] = useState(value);
  const n = items.length;
  const middleStart = Math.floor(REPEAT / 2) * n;
  const edgeBand = Math.floor(REPEAT / 2) - 1;
  const padRows = Math.floor(visibleRows / 2);

  valueRef.current = value;
  onSettleRef.current = onSettle;

  const longList = useMemo(() => {
    const arr = [];
    for (let r = 0; r < REPEAT; r += 1) arr.push(...items);
    return arr;
  }, [items]);

  const indexForValue = (val) => {
    const i = items.findIndex((it) => it.value === val);
    return middleStart + Math.max(i, 0);
  };

  const indexFromScrollTop = (top) => {
    const rawIdx = Math.round(top / itemHeight);
    return Math.max(0, Math.min(longList.length - 1, rawIdx));
  };

  const valueAtIndex = (idx) => items[((idx % n) + n) % n].value;

  const displayIndexFor = (targetIdx) => {
    const band = Math.floor((targetIdx - middleStart) / n);
    if (Math.abs(band) < edgeBand) return targetIdx;
    return middleStart + (((targetIdx % n) + n) % n);
  };

  const scrollToIndex = (idx, behavior) => {
    const el = containerRef.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({ top: idx * itemHeight, behavior });
    scrollIdxRef.current = idx;
    absIdxRef.current = idx;
    setScrollValue(valueAtIndex(idx));
    window.setTimeout(() => { programmatic.current = false; }, behavior === 'smooth' ? 200 : 20);
  };

  const commitIndex = (targetIdx, behavior = 'auto') => {
    const val = items[((targetIdx % n) + n) % n].value;
    const prevPhysical = scrollIdxRef.current ?? targetIdx;
    const deltaIdx = targetIdx - prevPhysical;
    const beforeAbs = absIdxRef.current ?? targetIdx;
    const afterAbs = beforeAbs + deltaIdx;
    const wraps = Math.floor(afterAbs / n) - Math.floor(beforeAbs / n);
    const displayIdx = displayIndexFor(targetIdx);

    scrollIdxRef.current = displayIdx;
    absIdxRef.current = afterAbs;
    scrollToIndex(displayIdx, behavior);

    if (val !== lastEmitted.current || wraps !== 0) {
      lastEmitted.current = val;
      onSettleRef.current(val, wraps);
    }
  };

  const moveBySteps = (steps) => {
    if (!steps) return;
    const currentIdx = scrollIdxRef.current ?? indexForValue(valueRef.current);
    commitIndex(currentIdx + steps);
  };

  const moveOneStep = (direction) => {
    if (!direction) return;
    const currentIdx = scrollIdxRef.current ?? indexForValue(valueRef.current);
    commitIndex(currentIdx + direction, 'auto');
  };

  useImperativeHandle(ref, () => ({
    bumpBy(steps) {
      moveBySteps(steps);
    },
  }));

  useEffect(() => {
    const idx = indexForValue(value);
    scrollIdxRef.current = idx;
    absIdxRef.current = idx;
    lastEmitted.current = value;
    setScrollValue(value);
    scrollToIndex(idx, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setScrollValue(value);
    scrollToIndex(indexForValue(value), 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const snapToNearest = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = indexFromScrollTop(el.scrollTop);
    const snappedVal = valueAtIndex(idx);
    const displayIdx = displayIndexFor(idx);
    scrollToIndex(displayIdx, 'auto');
    if (snappedVal !== lastEmitted.current) {
      const prevPhysical = scrollIdxRef.current ?? idx;
      const deltaIdx = displayIdx - prevPhysical;
      const beforeAbs = absIdxRef.current ?? idx;
      const afterAbs = beforeAbs + deltaIdx;
      const wraps = Math.floor(afterAbs / n) - Math.floor(beforeAbs / n);
      scrollIdxRef.current = displayIdx;
      absIdxRef.current = afterAbs;
      lastEmitted.current = snappedVal;
      setScrollValue(snappedVal);
      onSettleRef.current(snappedVal, wraps);
    }
  };

  const handleScroll = () => {
    if (programmatic.current) return;
    const el = containerRef.current;
    if (!el) return;
    setScrollValue(valueAtIndex(indexFromScrollTop(el.scrollTop)));
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(snapToNearest, SETTLE_DEBOUNCE_MS);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const fineThreshold = itemHeight * FINE_WHEEL_THRESHOLD_RATIO;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = normalizeWheelDeltaY(e, itemHeight);
      if (!delta) return;

      const absDelta = Math.abs(delta);
      const direction = delta > 0 ? 1 : -1;
      const now = performance.now();

      // Mouse / coarse wheel: one detent → exactly one row (ignore magnitude).
      if (absDelta >= COARSE_WHEEL_MIN_PX) {
        if (now - coarseWheelAtRef.current < COARSE_WHEEL_COOLDOWN_MS) return;
        coarseWheelAtRef.current = now;
        wheelAccumRef.current = 0;
        moveOneStep(direction);
        return;
      }

      // Trackpad: accumulate fine deltas, one row per threshold crossed per event.
      wheelAccumRef.current += delta;
      if (Math.abs(wheelAccumRef.current) < fineThreshold) return;
      wheelAccumRef.current -= direction * fineThreshold;
      moveOneStep(direction);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [itemHeight]);

  useEffect(() => () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
  }, []);

  const handleItemClick = (idx) => {
    const val = items[((idx % n) + n) % n].value;
    if (val === valueRef.current) return;
    commitIndex(idx);
  };

  const colHeight = itemHeight * visibleRows;

  return (
    <div
      ref={containerRef}
      className={`wheel-column ${className}`}
      style={{ height: colHeight }}
      onScroll={handleScroll}
    >
      <div className="wheel-column-pad" style={{ height: itemHeight * padRows }} />
      {longList.map((it, i) => (
        <div
          key={i}
          className={`wheel-item${it.value === scrollValue ? ' active' : ''}`}
          style={{ height: itemHeight }}
          onClick={() => handleItemClick(i)}
        >
          {it.label}
        </div>
      ))}
      <div className="wheel-column-pad" style={{ height: itemHeight * padRows }} />
    </div>
  );
});

function MeridiemWheel({ value, onChange, itemHeight = ITEM_H, visibleRows = DEFAULT_VISIBLE }) {
  const rootRef = useRef(null);
  const accumRef = useRef(0);
  const coarseAtRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const padRows = Math.floor(visibleRows / 2);
  const fineThreshold = itemHeight * FINE_WHEEL_THRESHOLD_RATIO;

  valueRef.current = value;
  onChangeRef.current = onChange;

  const toggle = () => {
    onChangeRef.current(valueRef.current === 'AM' ? 'PM' : 'AM');
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = normalizeWheelDeltaY(e, itemHeight);
      if (!delta) return;

      const absDelta = Math.abs(delta);
      const now = performance.now();

      if (absDelta >= COARSE_WHEEL_MIN_PX) {
        if (now - coarseAtRef.current < COARSE_WHEEL_COOLDOWN_MS) return;
        coarseAtRef.current = now;
        accumRef.current = 0;
        toggle();
        return;
      }

      accumRef.current += delta;
      if (Math.abs(accumRef.current) < fineThreshold) return;
      accumRef.current = 0;
      toggle();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [itemHeight, fineThreshold]);

  return (
    <div
      ref={rootRef}
      className="wheel-column wheel-column--meridiem"
      style={{ height: itemHeight * visibleRows }}
    >
      <div
        className={`meridiem-track${value === 'PM' ? ' is-pm' : ''}`}
        style={{
          paddingTop: itemHeight * padRows,
          paddingBottom: itemHeight * padRows,
          transform: value === 'PM' ? `translateY(-${itemHeight}px)` : undefined,
        }}
      >
        <button type="button" className={`meridiem-item${value === 'AM' ? ' active' : ''}`} style={{ height: itemHeight }} onClick={() => onChange('AM')}>AM</button>
        <button type="button" className={`meridiem-item${value === 'PM' ? ' active' : ''}`} style={{ height: itemHeight }} onClick={() => onChange('PM')}>PM</button>
      </div>
    </div>
  );
}

export function TimeWheelPicker({
  hour12, minute, meridiem, onChange, compact = false, visibleRows,
}) {
  const hourRef = useRef(null);
  const resolvedVisible = visibleRows ?? (compact ? 3 : DEFAULT_VISIBLE);
  const itemHeight = compact ? 36 : ITEM_H;

  const handleHourSettle = (nextHour, wraps) => {
    const flip = (((wraps % 2) + 2) % 2) === 1;
    onChange({ hour12: nextHour, minute, meridiem: flip ? (meridiem === 'AM' ? 'PM' : 'AM') : meridiem });
  };

  const handleMinuteSettle = (nextMinute, wraps) => {
    onChange({ hour12, minute: nextMinute, meridiem });
    if (wraps !== 0) hourRef.current?.bumpBy(wraps);
  };

  return (
    <div className={`time-wheel-picker${compact ? ' time-wheel-picker--compact' : ''}${resolvedVisible === 3 ? ' time-wheel-picker--rows-3' : ''}`}>
      <div className="time-wheel-highlight" aria-hidden="true" />
      <WheelColumn
        ref={hourRef}
        items={HOURS}
        value={hour12}
        onSettle={handleHourSettle}
        className="wheel-column--hour"
        itemHeight={itemHeight}
        visibleRows={resolvedVisible}
      />
      <span className="time-wheel-colon">:</span>
      <WheelColumn
        items={MINUTES}
        value={minute}
        onSettle={handleMinuteSettle}
        className="wheel-column--minute"
        itemHeight={itemHeight}
        visibleRows={resolvedVisible}
      />
      <MeridiemWheel
        value={meridiem}
        onChange={(nextMeridiem) => onChange({ hour12, minute, meridiem: nextMeridiem })}
        itemHeight={itemHeight}
        visibleRows={resolvedVisible}
      />
    </div>
  );
}

export function minutesToPickerState(totalMinutes) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  return {
    hour12: h24 % 12 || 12,
    minute: m,
    meridiem: h24 >= 12 ? 'PM' : 'AM',
  };
}

export function pickerStateToMinutes({ hour12, minute, meridiem }) {
  let h = hour12 % 12;
  if (meridiem === 'PM') h += 12;
  return h * 60 + minute;
}
