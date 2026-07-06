import { useCallback, useRef, useState } from 'react';

const SIZE = 160;
const RADIUS = SIZE / 2;

function hsvToRgb(h, s, v) {
  const sf = s / 100;
  const vf = v / 100;
  const c = vf * sf;
  const hh = (h / 60) % 6;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = vf - c;
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHs(r, g, b) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  return { h, s };
}

const DEFAULT_COLOR = { r: 255, g: 255, b: 255 };

// Round hue/saturation picker — angle around the wheel sets hue, distance
// from center sets saturation. Value (brightness) is controlled separately
// by LightPanel's brightness slider, so this always emits full-value RGB.
//
// `onChange` fires continuously while dragging for instant local visual
// feedback (no network call should happen here — the mock API round trip is
// too slow to keep up with pointermove and responses can arrive out of
// order, which is what made dragging feel laggy). `onCommit` fires once,
// on pointer release, with the final color — that's the only time the
// caller should invoke the device.
export function ColorWheel({ color, onChange, onCommit }) {
  const safeColor = color || DEFAULT_COLOR;
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const lastColorRef = useRef(safeColor);
  const { h, s } = rgbToHs(safeColor.r, safeColor.g, safeColor.b);

  const updateFromEvent = useCallback((event) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const dist = Math.min(Math.hypot(dx, dy), RADIUS);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const hue = (angle + 360) % 360;
    const sat = (dist / RADIUS) * 100;
    const next = hsvToRgb(hue, sat, 100);
    lastColorRef.current = next;
    onChange(next);
  }, [onChange]);

  const handleDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromEvent(event);
  };
  const handleMove = (event) => {
    if (dragging) updateFromEvent(event);
  };
  const handleUp = () => {
    if (dragging) onCommit?.(lastColorRef.current);
    setDragging(false);
  };

  const knobDist = (s / 100) * RADIUS;
  const knobAngle = (h * Math.PI) / 180;
  const knobX = RADIUS + knobDist * Math.cos(knobAngle);
  const knobY = RADIUS + knobDist * Math.sin(knobAngle);

  return (
    <div
      ref={ref}
      className="color-wheel"
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div className="color-wheel-center" />
      <div
        className="color-wheel-knob"
        style={{ left: knobX, top: knobY, background: `rgb(${safeColor.r}, ${safeColor.g}, ${safeColor.b})` }}
      />
    </div>
  );
}
