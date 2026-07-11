import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { useRef } from 'react';

export function PtzPad({ onMove, onStop, disabled }) {
  const movingRef = useRef(false);

  const startMove = (event, vector) => {
    if (disabled || movingRef.current) return;
    movingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onMove?.(vector);
  };

  const stopMove = (event) => {
    if (!movingRef.current) return;
    movingRef.current = false;
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    onStop?.();
  };

  return (
    <div className={`ptz-pad-btn${disabled ? ' disabled' : ''}`}>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--up"
        onPointerDown={(e) => startMove(e, { pan: 0, tilt: 1 })}
        onPointerUp={stopMove}
        onPointerCancel={stopMove}
        aria-label="위로"
      >
        <ChevronUpIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--right"
        onPointerDown={(e) => startMove(e, { pan: 1, tilt: 0 })}
        onPointerUp={stopMove}
        onPointerCancel={stopMove}
        aria-label="오른쪽"
      >
        <ChevronRightIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--down"
        onPointerDown={(e) => startMove(e, { pan: 0, tilt: -1 })}
        onPointerUp={stopMove}
        onPointerCancel={stopMove}
        aria-label="아래로"
      >
        <ChevronDownIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--left"
        onPointerDown={(e) => startMove(e, { pan: -1, tilt: 0 })}
        onPointerUp={stopMove}
        onPointerCancel={stopMove}
        aria-label="왼쪽"
      >
        <ChevronLeftIcon width={16} height={16} />
      </button>
      <div className="ptz-hub" aria-hidden="true" />
    </div>
  );
}
