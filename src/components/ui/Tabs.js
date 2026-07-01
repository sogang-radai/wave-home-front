export function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map(([id, label]) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
