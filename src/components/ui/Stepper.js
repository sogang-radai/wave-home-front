export function Stepper({ value, min, max, step = 1, unit = '', onChange }) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={decrease} disabled={value <= min} aria-label="값 감소">
        −
      </button>
      <span className="stepper-value">{value}{unit}</span>
      <button type="button" className="stepper-btn" onClick={increase} disabled={value >= max} aria-label="값 증가">
        +
      </button>
    </div>
  );
}
