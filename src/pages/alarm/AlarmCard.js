import { computeNextFireDate, formatClock12, formatNextFireLabel } from './alarmUtils';

export function AlarmCard({ alarm, selected, onSelect, onToggleEnabled }) {
  const { hour12, minute, meridiem } = formatClock12(alarm.timeMinute);
  const nextFireDate = computeNextFireDate(alarm);
  const nextFireLabel = formatNextFireLabel(nextFireDate);

  return (
    <article
      className={`alarm-card${selected ? ' selected' : ''}${alarm.enabled ? '' : ' disabled'}`}
      onClick={() => onSelect(alarm)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(alarm); }}
    >
      {alarm.smartWake && <span className="alarm-card-tag">기상</span>}

      <div className="alarm-card-time">
        <span className="alarm-card-clock">{String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span>
        <span className="alarm-card-meridiem">{meridiem}</span>
      </div>

      <p className="alarm-card-name">{alarm.name}</p>
      <p className="alarm-card-next">{nextFireLabel}</p>

      <button
        type="button"
        className={`toggle-switch toggle-switch--sm alarm-card-toggle${alarm.enabled ? ' on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleEnabled(alarm); }}
        aria-label="알람 활성화"
      >
        <i />
      </button>
    </article>
  );
}
