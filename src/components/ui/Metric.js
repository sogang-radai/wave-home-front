export function Metric({ label, value, detail, dot, dotCorner = false }) {
  return (
    <div className={`metric${dotCorner && dot ? ' metric--dot-corner' : ''}`}>
      {dotCorner && dot && <span className={`metric-dot ${dot}`} aria-hidden="true" />}
      <p>{label}</p>
      <strong>
        {!dotCorner && dot && <span className={`metric-dot ${dot}`} />}
        {value}
      </strong>
      {detail != null && detail !== '' && <span>{detail}</span>}
    </div>
  );
}
