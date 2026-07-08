import {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef,
} from 'react';

const ITEM_H = 44;
const VISIBLE = 5; // odd, so there's a single centered row
const REPEAT = 11; // odd number of repeated bands, gives room to drift before re-centering
const WHEEL_DAMPING = 0.35; // native wheel deltaY is much larger than one row; scale it down for a natural feel

const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

/**
 * A single infinite-scroll wheel column. Items are repeated `REPEAT` times so
 * scrolling never visually "runs out"; once the scroll position drifts near
 * an outer band we silently jump it back to the equivalent middle-band
 * position (no animation, imperceptible because the repeated bands are
 * pixel-identical).
 *
 * `onSettle(val, wraps)` fires once whenever the wheel comes to rest on a new
 * row and/or crosses a full-list boundary (`wraps`, e.g. minute 59→0 or
 * hour 12→1). Both pieces of information are delivered together in one call
 * so the parent can apply them as a single atomic state update — splitting
 * them into two separate callbacks invited stale-closure races where one
 * update stomped the other.
 *
 * `bumpBy(steps)` (via ref) nudges the wheel by an exact number of rows using
 * a genuine physical scroll (so it settles and reports through the exact
 * same path as user-driven scrolling) — used to cascade minute overflow into
 * the hour wheel.
 */
const WheelColumn = forwardRef(function WheelColumn({ items, value, onSettle, className = '' }, ref) {
  const containerRef = useRef(null);
  const settleTimer = useRef(null);
  const programmatic = useRef(false);
  const lastEmitted = useRef(value);
  const scrollIdxRef = useRef(null); // last known physical row index (kept in sync across re-centers)
  const absIdxRef = useRef(null); // logical, never re-centered — used only for wrap-counting math
  const n = items.length;
  const middleStart = Math.floor(REPEAT / 2) * n;

  const longList = useMemo(() => {
    const arr = [];
    for (let r = 0; r < REPEAT; r += 1) arr.push(...items);
    return arr;
  }, [items]);

  const indexForValue = (val) => {
    const i = items.findIndex((it) => it.value === val);
    return middleStart + Math.max(i, 0);
  };

  const scrollToIndex = (idx, behavior) => {
    const el = containerRef.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({ top: idx * ITEM_H, behavior });
    scrollIdxRef.current = idx;
    absIdxRef.current = idx;
    window.setTimeout(() => { programmatic.current = false; }, behavior === 'smooth' ? 260 : 30);
  };

  useImperativeHandle(ref, () => ({
    bumpBy(steps) {
      const el = containerRef.current;
      if (!el || !steps) return;
      el.scrollBy({ top: steps * ITEM_H, behavior: 'smooth' });
    },
  }));

  // Mount: jump to the initial value with no animation.
  useEffect(() => {
    scrollToIndex(indexForValue(value), 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Genuinely external value change (e.g. switching to a different alarm's
  // draft). Our own scroll-driven commits are excluded via lastEmitted so we
  // never yank the wheel back to a fixed reference position mid-scroll.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    scrollToIndex(indexForValue(value), 'smooth');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleScroll = () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const rawIdx = Math.round(el.scrollTop / ITEM_H);
      const idx = Math.max(0, Math.min(longList.length - 1, rawIdx));
      const val = items[((idx % n) + n) % n].value;

      const prevPhysical = scrollIdxRef.current ?? idx;
      const deltaIdx = idx - prevPhysical;
      scrollIdxRef.current = idx;

      const beforeAbs = absIdxRef.current ?? idx;
      const afterAbs = beforeAbs + deltaIdx;
      absIdxRef.current = afterAbs;
      const wraps = Math.floor(afterAbs / n) - Math.floor(beforeAbs / n);

      // Drifted close to an outer band edge — recenter silently. This only
      // moves scrollTop to a pixel-identical spot in the middle band, so
      // it's imperceptible and doesn't affect the logical (abs) position.
      const band = Math.floor((idx - middleStart) / n);
      if (Math.abs(band) >= Math.floor(REPEAT / 2) - 1) {
        const recentered = middleStart + (((idx % n) + n) % n);
        programmatic.current = true;
        el.scrollTop = recentered * ITEM_H;
        scrollIdxRef.current = recentered;
        window.requestAnimationFrame(() => { programmatic.current = false; });
      }

      if (val !== value || wraps !== 0) {
        lastEmitted.current = val;
        onSettle(val, wraps);
      }
    }, 110);
  };

  // Native wheel deltaY per "notch" is far larger than one row, which made
  // the list jump several rows per tick with no natural momentum. We scale
  // it down and apply it directly to scrollTop (not an animated scrollBy),
  // so movement stays perfectly proportional to the wheel input — exactly
  // like native scrolling, just calibrated to this wheel's row height. The
  // browser's own scroll-snap then glides it to rest once motion stops.
  const handleWheel = (e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop += e.deltaY * WHEEL_DAMPING;
    // Direct scrollTop mutation doesn't reliably dispatch a native 'scroll'
    // event on every browser/timing combo, so drive the same settle logic
    // explicitly to make sure the debounce always (re)schedules.
    handleScroll();
  };

  useEffect(() => () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`wheel-column ${className}`}
      style={{ height: ITEM_H * VISIBLE }}
      onScroll={handleScroll}
      onWheel={handleWheel}
    >
      <div className="wheel-column-pad" style={{ height: ITEM_H * Math.floor(VISIBLE / 2) }} />
      {longList.map((it, i) => (
        <div key={i} className={`wheel-item${it.value === value ? ' active' : ''}`} style={{ height: ITEM_H }}>
          {it.label}
        </div>
      ))}
      <div className="wheel-column-pad" style={{ height: ITEM_H * Math.floor(VISIBLE / 2) }} />
    </div>
  );
});

// AM/PM is NOT an independently-scrollable wheel — it only ever shows one
// label at a time and slides to the other when the hour wheel crosses the
// 12-hour boundary (driven purely by the `value` prop from the parent).
function MeridiemFlip({ value }) {
  return (
    <div className="wheel-column wheel-column--meridiem">
      <div className={`meridiem-track${value === 'PM' ? ' is-pm' : ''}`}>
        <span className="meridiem-item">AM</span>
        <span className="meridiem-item">PM</span>
      </div>
    </div>
  );
}

/**
 * 12시간제 시/분/AM-PM 피커.
 * - 시(hour)와 분(minute)은 진짜 무한 스크롤 휠.
 * - 분이 59→0(정방향) 또는 0→59(역방향)로 넘어가면 시(hour)가 함께 넘어간다.
 * - AM/PM은 시(hour)가 12↔1 경계를 넘을 때만(스크롤 거리와 무관하게 홀/짝
 *   교차 횟수로 판정) 서로 뒤바뀌는 단일 표시(슬라이드 전환)이다.
 */
export function TimeWheelPicker({ hour12, minute, meridiem, onChange }) {
  const hourRef = useRef(null);

  const handleHourSettle = (nextHour, wraps) => {
    const flip = (((wraps % 2) + 2) % 2) === 1;
    onChange({ hour12: nextHour, minute, meridiem: flip ? (meridiem === 'AM' ? 'PM' : 'AM') : meridiem });
  };

  const handleMinuteSettle = (nextMinute, wraps) => {
    onChange({ hour12, minute: nextMinute, meridiem });
    if (wraps !== 0) hourRef.current?.bumpBy(wraps);
  };

  return (
    <div className="time-wheel-picker">
      <div className="time-wheel-highlight" aria-hidden="true" />
      <WheelColumn ref={hourRef} items={HOURS} value={hour12} onSettle={handleHourSettle} className="wheel-column--hour" />
      <span className="time-wheel-colon">:</span>
      <WheelColumn items={MINUTES} value={minute} onSettle={handleMinuteSettle} className="wheel-column--minute" />
      <MeridiemFlip value={meridiem} />
    </div>
  );
}
