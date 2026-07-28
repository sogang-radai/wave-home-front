import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Hover/focus info popover (click toggles on touch).
 * - default: compact dark tip (short strings)
 * - panel: light card popover for longer structured content
 *
 * The bubble renders through a portal into document.body with `position:
 * fixed`, positioned from the trigger's own bounding rect — so it's never
 * clipped by an ancestor's overflow:hidden/auto (slide-transition
 * viewports, fixed-height wizard steps, scrollable cards, etc.), no matter
 * where in the page this is used.
 */
export function InfoTooltip({ text, children, wide = false, panel = false, placement = 'top' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const rootRef = useRef(null);
  const bubbleRef = useRef(null);
  const bubbleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (bubbleRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Recompute the trigger's viewport position whenever the bubble opens, and
  // keep it pinned to the trigger while scrolling/resizing.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const updateCoords = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setCoords({
        top: placement === 'bottom' ? rect.bottom + 10 : rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    };
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, placement]);

  return (
    <span
      ref={rootRef}
      className={[
        'info-tooltip',
        wide ? 'info-tooltip--wide' : '',
        panel ? 'info-tooltip--panel' : '',
        open ? 'is-open' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label="설명 보기"
        aria-expanded={open}
        aria-controls={bubbleId}
        onFocus={() => setOpen(true)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span className="info-tooltip-icon" aria-hidden="true">i</span>
      </button>
      {open && coords && createPortal(
        <span
          ref={bubbleRef}
          id={bubbleId}
          role="tooltip"
          className={[
            'info-tooltip-bubble',
            wide ? 'info-tooltip-bubble--wide' : '',
            panel ? 'info-tooltip-bubble--panel' : '',
          ].filter(Boolean).join(' ')}
          style={{
            top: coords.top,
            left: coords.left,
            transform: placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          {children || text}
        </span>,
        document.body,
      )}
    </span>
  );
}
