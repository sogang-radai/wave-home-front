export function Metric({ label, value, detail, dot, dotCorner = false }) {
  const showInlineDot = Boolean(dot) && !dotCorner;
  return (
    <div className={`metric${dotCorner && dot ? ' metric--dot-corner' : ''}`}>
      {dotCorner && dot && <span className={`metric-dot ${dot}`} aria-hidden="true" />}
      <p>{label}</p>
      <strong className={showInlineDot ? 'metric-value--with-dot' : undefined}>
        {showInlineDot && <span className={`metric-dot ${dot}`} aria-hidden="true" />}
        {value}
      </strong>
      {detail != null && detail !== '' && <span className="metric-detail">{detail}</span>}
    </div>
  );
}
