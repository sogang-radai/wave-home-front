import { useLayoutEffect, useRef, useState } from 'react';

// Below this, text/controls stop shrinking and the fallback becomes a
// normal scroll (see useFitZoom's outer overflow-y: auto) instead of
// squeezing the dashboard into something unreadable. Raised from 0.62 —
// that let card text shrink far enough to be hard to read; the (invisible
// but functional) scroll fallback engaging a bit more often on short
// viewports is the better trade-off.
const MIN_ZOOM = 0.85;
const ZOOM_EPSILON = 0.005;
// zoom scales layout by rounding to whole device pixels at every nested
// element, so the actual rendered height of a deeply-nested tree can end up
// a few px taller than naturalHeight * zoom predicts. Budgeting slightly
// less than the true available height absorbs that drift so the fitted
// content doesn't just barely overflow and trigger the fallback scrollbar.
const SAFETY_MARGIN = 0.97;

/**
 * Scales an "inner" content block down (via CSS zoom, so layout reflows
 * with it — cards, gaps, and text all shrink together) to fit inside an
 * "outer" container's actual rendered height, recalculating on any resize
 * of either box. Never scales up past 1 (a roomy window keeps native size)
 * and never shrinks past MIN_ZOOM (outer scrolls instead, so nothing is
 * ever forced smaller than legible).
 *
 * `active` lets the caller opt out (e.g. on mobile, where the page already
 * scrolls freely and shouldn't be forced into a fit-to-height box).
 */
export function useFitZoom(active = true) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    if (!active) {
      setZoom(1);
      return undefined;
    }
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    let frame = null;
    const measure = () => {
      frame = null;
      // CSS zoom makes descendants' size APIs (scrollHeight etc.) report the
      // already-zoomed, on-screen size — measuring naturalHeight while
      // zoomed would keep shrinking it forever as content loads in. Force
      // the content back to its true (zoom: 1) size for the measurement,
      // then immediately restore whatever zoom was applied; both mutations
      // happen in the same synchronous pass so nothing paints in between.
      const restoreZoom = inner.style.zoom;
      inner.style.zoom = '1';
      const naturalHeight = inner.scrollHeight;
      const availableHeight = outer.clientHeight;
      inner.style.zoom = restoreZoom;

      if (!availableHeight || !naturalHeight) return;
      const next = Math.min(1, Math.max(MIN_ZOOM, (availableHeight * SAFETY_MARGIN) / naturalHeight));
      setZoom((prev) => (Math.abs(prev - next) > ZOOM_EPSILON ? next : prev));
    };

    const schedule = () => {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(outer);
    observer.observe(inner);
    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [active]);

  return { outerRef, innerRef, zoom: active ? zoom : 1 };
}
