export function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map(([id, label, badge]) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>
          {label}
          {badge && <span className="tab-badge">{badge}</span>}
        </button>
      ))}
    </div>
  );
}
