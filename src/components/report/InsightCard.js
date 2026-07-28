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

const SCHEDULE_DAY_LABELS = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

function formatClock(minutes) {
  if (typeof minutes !== 'number') return null;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Renders scheduleTaskJson (e.g. { dayOfWeek: 'sun', startMinute: 1320, endMinute: 1350, title }) as "매주 일요일 22:00~22:30 · 취침 전 침실 미리 냉방". */
function formatScheduleTask(scheduleTaskJson) {
  if (!scheduleTaskJson) return null;
  const { title, dayOfWeek, startMinute, endMinute, scheduleKind } = scheduleTaskJson;
  const start = formatClock(startMinute);
  const end = formatClock(endMinute);
  const timeRange = start && end ? `${start}~${end}` : start;
  const dayLabel = scheduleKind === 'weekly' && dayOfWeek
    ? `매주 ${SCHEDULE_DAY_LABELS[dayOfWeek] || dayOfWeek}요일`
    : '';
  return [dayLabel, timeRange, title].filter(Boolean).join(' ');
}

/** automation_rule 용 — ruleJson.schedule(예: {repeat:'daily'|'weekly'|'once', time:'HH:MM',
 * dayOfWeek?}) 또는 ruleJson.trigger 를 formatScheduleTask 와 같은 "🕒 ..." 형태로 요약한다.
 * schedule_task 만 지원하던 기존 배지가 automation_rule 항목(오늘 sleep_report 액션 2개처럼)
 * 에서는 아예 안 뜨던 문제를 고친다. ruleJson.name(그 규칙의 이름)을 뒤에 붙여서 "매일
 * 23:00 · 쾌적한 수면 환경 유지"처럼 어떤 규칙인지도 함께 보이게 한다. */
function formatAutomationRule(ruleJson) {
  if (!ruleJson) return null;
  const { schedule, trigger, name } = ruleJson;
  let timing = null;
  if (schedule?.time) {
    const repeatLabel = schedule.repeat === 'weekly' && schedule.dayOfWeek
      ? `매주 ${SCHEDULE_DAY_LABELS[schedule.dayOfWeek] || schedule.dayOfWeek}요일`
      : schedule.repeat === 'once' ? '1회' : '매일';
    timing = `${repeatLabel} ${schedule.time}`;
  } else if (trigger) {
    timing = '조건 발생 시 자동 실행';
  }
  return [timing, name].filter(Boolean).join(' · ') || null;
}

export function InsightCard({ id, label, kind, title, text, approved, actionable, actionType, scheduleTaskJson, ruleJson, onToggle, plainFooter }) {
  const kindMeta = INSIGHT_KIND_META[kind];
  const badgeLabel = kindMeta?.label || label;
  const badgeClassName = `insight-card-label${kindMeta ? ` ${kindMeta.className}` : ''}`;
  const scheduleSummary = actionType === 'schedule_task'
    ? formatScheduleTask(scheduleTaskJson)
    : actionType === 'automation_rule'
      ? formatAutomationRule(ruleJson)
      : null;

  return (
    <article className={`insight-card${approved ? ' applied' : ''}${plainFooter ? ' plain-footer' : ''}`}>
      <header className="insight-card-head">
        <span className={badgeClassName}>{badgeLabel}</span>
        <h4 className="insight-card-title">{title}</h4>
      </header>
      <p className="insight-card-text">{text}</p>
      {scheduleSummary && <p className="insight-card-schedule">🕒 {scheduleSummary}</p>}
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
