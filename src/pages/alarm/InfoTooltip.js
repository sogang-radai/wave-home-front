import { useEffect, useId, useRef, useState } from 'react';

/**
 * Click/keyboard toggle info popover.
 * - default: compact dark tip (short strings)
 * - panel: light card popover for longer structured content
 */
export function InfoTooltip({ text, children, wide = false, panel = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const bubbleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
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

  return (
    <span
      ref={rootRef}
      className={[
        'info-tooltip',
        wide ? 'info-tooltip--wide' : '',
        panel ? 'info-tooltip--panel' : '',
        open ? 'is-open' : '',
      ].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label="설명 보기"
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span className="info-tooltip-icon" aria-hidden="true">i</span>
      </button>
      {open && (
        <span id={bubbleId} className="info-tooltip-bubble" role="tooltip">
          {children || text}
        </span>
      )}
    </span>
  );
}
