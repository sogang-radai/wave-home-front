import { useId } from 'react';
import { motion } from 'framer-motion';

export function Tabs({ items, active, onChange, coachMarkPrefix = 'hometab' }) {
  const layoutId = useId();

  return (
    <div className="tabs">
      {items.map(([id, label, badge]) => (
        <button
          key={id}
          className={active === id ? 'active' : ''}
          data-coachmark={coachMarkPrefix ? `${coachMarkPrefix}-${id}` : undefined}
          onClick={() => onChange(id)}
        >
          {active === id && (
            <motion.span
              layoutId={`tabs-pill-${layoutId}`}
              className="tabs-pill"
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          )}
          <span className="tabs-label">
            {label}
            {badge && <span className="tab-badge">{badge}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
