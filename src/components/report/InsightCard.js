export let insightIdCounter = 0;
export function withInsightIds(items) {
  return items.map(([label, title, text]) => ({ id: ++insightIdCounter, label, title, text }));
}

const INSIGHT_KIND_META = {
  tip: { label: '팁', className: 'insight-card-label--tip' },
  goal: { label: '목표', className: 'insight-card-label--goal' },
  action: { label: '실행 제안', className: 'insight-card-label--action' },
  banner: { label: '하이라이트', className: 'insight-card-label--banner' },
};

export function InsightCard({ id, label, kind, title, text, approved, actionable, onToggle, plainFooter }) {
  const kindMeta = INSIGHT_KIND_META[kind];
  const badgeLabel = kindMeta?.label || label;
  const badgeClassName = `insight-card-label${kindMeta ? ` ${kindMeta.className}` : ''}`;

  return (
    <article className={`insight-card${approved ? ' applied' : ''}${plainFooter ? ' plain-footer' : ''}`}>
      <header className="insight-card-head">
        <span className={badgeClassName}>{badgeLabel}</span>
      </header>
      <h4 className="insight-card-title">{title}</h4>
      <p className="insight-card-text">{text}</p>
      {actionable && (
        <footer className="insight-card-footer">
          <button type="button" className="insight-card-action" onClick={() => onToggle(id)}>
            {approved ? '✓ 적용됨' : '실행'}
          </button>
        </footer>
      )}
    </article>
  );
}
