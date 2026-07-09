export let insightIdCounter = 0;
export function withInsightIds(items) {
  return items.map(([label, title, text]) => ({ id: ++insightIdCounter, label, title, text }));
}

export function InsightCard({ id, label, title, text, approved, onToggle, plainFooter }) {
  return (
    <article className={`insight-card${approved ? ' applied' : ''}${plainFooter ? ' plain-footer' : ''}`}>
      <header className="insight-card-head">
        <span className="insight-card-label">{label}</span>
      </header>
      <h4 className="insight-card-title">{title}</h4>
      <p className="insight-card-text">{text}</p>
      <footer className="insight-card-footer">
        <button type="button" className="insight-card-action" onClick={() => onToggle(id)}>
          {approved ? '✓ 적용됨' : '실행'}
        </button>
      </footer>
    </article>
  );
}
