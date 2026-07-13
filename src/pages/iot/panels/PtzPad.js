import { useMemo, useRef } from 'react';

const PAD_SIZE = 100;
const CX = 50;
const CY = 50;
const OUTER_R = 48;
const INNER_R = 23;
/** Constant seam width in SVG units (same at hub and rim). */
const GAP_WIDTH = 2.2;

function toXY(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

/**
 * Annulus sector with constant-width gaps.
 * Nominal start/end are the diagonal seam centerlines (e.g. -45° / 45°).
 * Edge angles grow toward the hub so the visible seam stays ~GAP_WIDTH.
 * Angle 0° = top, increases clockwise.
 */
function annularSectorPath(innerR, outerR, startDeg, endDeg, gapWidth) {
  const halfGapDeg = (r) => (Math.asin(Math.min(0.95, (gapWidth / 2) / r)) * 180) / Math.PI;
  const φo = halfGapDeg(outerR);
  const φi = halfGapDeg(innerR);
  const o0 = startDeg + φo;
  const o1 = endDeg - φo;
  const i0 = startDeg + φi;
  const i1 = endDeg - φi;

  let sweep = o1 - o0;
  while (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;

  const [x1, y1] = toXY(outerR, o0);
  const [x2, y2] = toXY(outerR, o1);
  const [x3, y3] = toXY(innerR, i1);
  const [x4, y4] = toXY(innerR, i0);
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function chevronPath(direction) {
  // Tip points outward (away from hub) along the wedge.
  const midR = (INNER_R + OUTER_R) / 2;
  const tip = toXY(midR + 3.5, direction);
  const left = toXY(midR - 3.5, direction - 11);
  const right = toXY(midR - 3.5, direction + 11);
  return `M ${left[0].toFixed(2)} ${left[1].toFixed(2)} L ${tip[0].toFixed(2)} ${tip[1].toFixed(2)} L ${right[0].toFixed(2)} ${right[1].toFixed(2)}`;
}

const WEDGES = [
  // Nominal seams on the diagonals; movement matches button direction.
  { id: 'up', label: '위로', vector: { pan: 0, tilt: -1 }, start: -45, end: 45, chevronAt: 0 },
  { id: 'right', label: '오른쪽', vector: { pan: 1, tilt: 0 }, start: 45, end: 135, chevronAt: 90 },
  { id: 'down', label: '아래로', vector: { pan: 0, tilt: 1 }, start: 135, end: 225, chevronAt: 180 },
  { id: 'left', label: '왼쪽', vector: { pan: -1, tilt: 0 }, start: 225, end: 315, chevronAt: 270 },
];

export function PtzPad({ onMove, onStop, disabled }) {
  const movingRef = useRef(false);
  const paths = useMemo(
    () => WEDGES.map((w) => ({
      ...w,
      d: annularSectorPath(INNER_R, OUTER_R, w.start, w.end, GAP_WIDTH),
      chevron: chevronPath(w.chevronAt),
    })),
    [],
  );

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
      <svg
        className="ptz-pad-svg"
        viewBox={`0 0 ${PAD_SIZE} ${PAD_SIZE}`}
        role="group"
        aria-label="PTZ 방향"
      >
        <circle className="ptz-pad-ring" cx={CX} cy={CY} r={OUTER_R} />
        {paths.map((w) => (
          <g key={w.id} className={`ptz-wedge-group ptz-wedge-group--${w.id}`}>
            <path
              className="ptz-wedge"
              d={w.d}
              onPointerDown={(e) => startMove(e, w.vector)}
              onPointerUp={stopMove}
              onPointerCancel={stopMove}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={w.label}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  startMove(e, w.vector);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  stopMove(e);
                }
              }}
            />
            <path className="ptz-wedge-chevron" d={w.chevron} />
          </g>
        ))}
        <circle className="ptz-hub" cx={CX} cy={CY} r={INNER_R - 0.5} />
      </svg>
    </div>
  );
}
