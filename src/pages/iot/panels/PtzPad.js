import { useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';

export function PtzPad({ onMove, onStop, onZoomDelta, zoom = 0, disabled }) {
  const zoomDialRef = useRef(null);
  const movingRef = useRef(false);

  useEffect(() => {
    const el = zoomDialRef.current;
    if (!el) return undefined;
    const handleWheel = (event) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      onZoomDelta?.(event.deltaY < 0 ? 4 : -4);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [disabled, onZoomDelta]);

  const startMove = (vector) => {
    if (disabled || movingRef.current) return;
    movingRef.current = true;
    onMove?.(vector);
  };

  const stopMove = () => {
    if (!movingRef.current) return;
    movingRef.current = false;
    onStop?.();
  };

  const fillDeg = Math.max(0, Math.min(100, zoom)) * 3.6;

  return (
    <div className={`ptz-pad-btn${disabled ? ' disabled' : ''}`}>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--up"
        onPointerDown={() => startMove({ pan: 0, tilt: 1 })}
        onPointerUp={stopMove}
        onPointerLeave={stopMove}
        onPointerCancel={stopMove}
        aria-label="위로"
      >
        <ChevronUpIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--right"
        onPointerDown={() => startMove({ pan: 1, tilt: 0 })}
        onPointerUp={stopMove}
        onPointerLeave={stopMove}
        onPointerCancel={stopMove}
        aria-label="오른쪽"
      >
        <ChevronRightIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--down"
        onPointerDown={() => startMove({ pan: 0, tilt: -1 })}
        onPointerUp={stopMove}
        onPointerLeave={stopMove}
        onPointerCancel={stopMove}
        aria-label="아래로"
      >
        <ChevronDownIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className="ptz-wedge ptz-wedge--left"
        onPointerDown={() => startMove({ pan: -1, tilt: 0 })}
        onPointerUp={stopMove}
        onPointerLeave={stopMove}
        onPointerCancel={stopMove}
        aria-label="왼쪽"
      >
        <ChevronLeftIcon width={16} height={16} />
      </button>
      <div
        ref={zoomDialRef}
        className="ptz-zoom-dial"
        style={{ background: `conic-gradient(from 180deg, var(--wave) 0deg ${fillDeg}deg, var(--wave-10) ${fillDeg}deg 360deg)` }}
        title="휠을 굴려 줌 조절"
      >
        <div className="ptz-zoom-dial-inner">
          <strong>{Math.round(zoom)}%</strong>
        </div>
      </div>
    </div>
  );
}
