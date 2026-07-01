import './ui.css';

export function Card({ title, action, children, wide, onClick }) {
  return (
    <section
      className={`card ${wide ? 'wide' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') onClick();
            }
          : undefined
      }
    >
      <div className="card-head">
        <h3>{title}</h3>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  );
}
