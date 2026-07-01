import { useApprovedActions } from '../../context/ApprovedActionsContext';

export let insightIdCounter = 0;
export function withInsightIds(items) {
  return items.map(([label, title, text]) => ({ id: ++insightIdCounter, label, title, text }));
}

export function InsightCard({ id, label, title, text }) {
  const { approved, toggle } = useApprovedActions();
  const isApproved = !!approved[id];

  return (
    <div className={`insight-card ${isApproved ? 'applied' : ''}`}>
      <span className="insight-card-label">{label}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      <button type="button" className="insight-card-action" onClick={() => toggle(id)}>
        {isApproved ? '✓ 적용됨' : '실행'}
      </button>
    </div>
  );
}
