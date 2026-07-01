export function Metric({ label, value, detail, dot }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>
        {dot && <span className={`metric-dot ${dot}`} />}
        {value}
      </strong>
      <span>{detail}</span>
    </div>
  );
}
