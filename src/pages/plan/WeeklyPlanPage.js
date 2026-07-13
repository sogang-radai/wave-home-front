import { useState, useMemo, useRef, useEffect } from 'react';
import {
  CAT_STYLE, CAL_H, CAL_END_MIN,
  minToY, yToMin, snapMin, fmtTime, getWeekDatesFromAnchor, addCalendarDays,
  PLAN_WEEKDAYS, PLAN_CAT_STYLE,
} from '../../data/weeklyPlanData';
import weeklyPlanApi from '../../api/weeklyPlanApi';
import goalsApi from '../../api/goalsApi';
import { DateNavigatorBar } from '../../components/calendar/DateNavigatorBar';
import { getToday, isSameDay, normalizeDate } from '../../components/calendar/calendarUtils';
import { getNow } from '../../lib/demoClock';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import { TimeWheelPicker, minutesToPickerState, pickerStateToMinutes } from '../alarm/TimeWheelPicker';
import '../alarm/alarm.css';
import '../main.css';
import './weeklyPlan.css';

const GOAL_CATEGORY_OPTIONS = [
  { value: 'sleep', label: '수면' },
  { value: 'posture', label: '자세' },
  { value: 'mental', label: '멘탈' },
  { value: 'life', label: '생활' },
  { value: 'diet', label: '식습관' },
];

const GOAL_TREND_LABEL = {
  improving: '개선되는 흐름이에요',
  steady: '꾸준히 유지되고 있어요',
  declining: '흔들리는 추세예요',
};

function normalizeRecommendationGroups(data) {
  if (!data?.length) return [];
  if (data[0]?.items) return data;
  const groups = new Map();
  data.forEach((item) => {
    const label = item.label || '추천';
    const key = item.label || 'default';
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key).items.push(item);
  });
  return [...groups.values()];
}

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapCatToPlanCategory(cat) {
  if (cat && PLAN_CAT_STYLE[cat]) return cat;
  if (cat === '식습관') return '일상';
  return '일정';
}

function buildPopupState({
  mode = 'add',
  dayLabel,
  startMin,
  endMin,
  id,
  title = '',
  done = false,
  cat,
  selectedDays,
  repeatWeekly = false,
}) {
  return {
    mode,
    id: mode === 'edit' ? id : undefined,
    title,
    done: !!done,
    startMin,
    endMin,
    startPicker: minutesToPickerState(startMin),
    endPicker: minutesToPickerState(endMin),
    selectedDays: selectedDays?.length ? selectedDays : [dayLabel],
    repeatWeekly: !!repeatWeekly,
    category: mapCatToPlanCategory(cat),
  };
}

export function WeeklyPlanPage({ todos, onToggleTodo, onAddTodo, onUpdateTodo, onDeleteTodo, onAddTodoFromInsight, onRefreshTodos }) {
  const isMobile = useMobileLayout();
  const [weekStartDate, setWeekStartDate] = useState(getToday);
  const weekDates = useMemo(() => getWeekDatesFromAnchor(weekStartDate), [weekStartDate]);
  const [recommendationGroups, setRecommendationGroups] = useState([]);
  const [agentReport, setAgentReport] = useState(null);
  const [updatingRecommendationId, setUpdatingRecommendationId] = useState(null);

  useEffect(() => {
    weeklyPlanApi.getRecommendations()
      .then((items) => setRecommendationGroups(normalizeRecommendationGroups(items)))
      .catch(() => setRecommendationGroups([]));
  }, []);

  useEffect(() => {
    const endOfWeek = weekDates[weekDates.length - 1]?.fullDate;
    const periodStart = endOfWeek ? formatDateParam(endOfWeek) : undefined;
    weeklyPlanApi
      .getWeeklyAgentReport(periodStart ? { periodStart } : {})
      .then(setAgentReport)
      .catch(() => setAgentReport(null));
  }, [weekDates]);

  const setRecommendationApproved = (id, approved) => {
    setRecommendationGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => (item.id === id ? { ...item, approved } : item)),
      }))
    );
  };

  const getRecommendationDay = (item) => {
    if (item.period === 'weekly') return weekDates[0]?.label || '월';
    return weekDates.find((day) => day.isToday)?.label || weekDates[0]?.label || '월';
  };

  const toggleRecommendation = async (id) => {
    const current = recommendationGroups.flatMap((group) => group.items).find((item) => item.id === id);
    if (!current) return;
    const linkedTasks = todos.filter((todo) => todo.sourceInsightId === id);
    const isApplied = current.approved || linkedTasks.length > 0;

    setUpdatingRecommendationId(id);
    try {
      if (isApplied) {
        await Promise.all(linkedTasks.map((todo) => onDeleteTodo(todo.id)));
        await weeklyPlanApi.updateInsight(id, { approved: false });
        setRecommendationApproved(id, false);
      } else {
        await onAddTodoFromInsight(id, getRecommendationDay(current));
        await weeklyPlanApi.updateInsight(id, { approved: true });
        setRecommendationApproved(id, true);
      }
    } finally {
      setUpdatingRecommendationId(null);
    }
  };

  const [activeGoal, setActiveGoal] = useState(null);
  const [goalCoaching, setGoalCoaching] = useState(null);
  const [goalTitleInput, setGoalTitleInput] = useState('');
  const [goalCategoryInput, setGoalCategoryInput] = useState('sleep');
  const [goalFormBusy, setGoalFormBusy] = useState(false);
  const [goalRecBusyId, setGoalRecBusyId] = useState(null);
  const [goalDismissed, setGoalDismissed] = useState(() => new Set());
  const goalTextareaRef = useRef(null);

  const growGoalTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 42)}px`;
  };

  useEffect(() => {
    goalsApi.getActiveGoal().then((goal) => {
      setActiveGoal(goal);
      if (!goal) return;
      goalsApi.getCoaching(goal.id).then(setGoalCoaching).catch(() => setGoalCoaching(null));
    }).catch(() => setActiveGoal(null));
  }, []);

  const submitGoal = async () => {
    const title = goalTitleInput.trim();
    if (!title || goalFormBusy) return;
    setGoalFormBusy(true);
    try {
      const goal = await goalsApi.createGoal({ title, category: goalCategoryInput });
      setActiveGoal(goal);
      setGoalTitleInput('');
      setGoalDismissed(new Set());
      const coaching = await goalsApi.getCoaching(goal.id);
      setGoalCoaching(coaching);
    } finally {
      setGoalFormBusy(false);
    }
  };

  const archiveActiveGoal = async () => {
    if (!activeGoal || goalFormBusy) return;
    setGoalFormBusy(true);
    try {
      await goalsApi.archiveGoal(activeGoal.id);
      setActiveGoal(null);
      setGoalCoaching(null);
    } finally {
      setGoalFormBusy(false);
    }
  };

  const toggleGoalRecommendation = async (item) => {
    if (!activeGoal || goalRecBusyId) return;
    setGoalRecBusyId(item.id);
    try {
      if (item.approved) {
        await goalsApi.cancelRecommendation(activeGoal.id, item.id);
      } else {
        await goalsApi.applyRecommendation(activeGoal.id, item.id);
      }
      const coaching = await goalsApi.getCoaching(activeGoal.id);
      setGoalCoaching(coaching);
      if (item.actionType === 'schedule_task' && onRefreshTodos) {
        await onRefreshTodos();
      }
    } finally {
      setGoalRecBusyId(null);
    }
  };

  const [dismissed, setDismissed] = useState(() => new Set());
  const [hoverApprovedId, setHoverApprovedId] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(-1);
  const [hoveredY, setHoveredY] = useState(0);
  const [drag, setDrag] = useState(null);
  const [moveDrag, setMoveDrag] = useState(null);
  const [popup, setPopup] = useState(null);
  const [nowMin, setNowMin] = useState(() => { const n = getNow(); return n.getHours() * 60 + n.getMinutes(); });
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const eventsRef = useRef(null);
  const popupInputRef = useRef(null);
  const moveDragRef = useRef(null);
  moveDragRef.current = moveDrag;

  useEffect(() => {
    const tick = () => { const n = getNow(); setNowMin(n.getHours() * 60 + n.getMinutes()); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Navigating to a different week resets the selected day: back to "today"
  // if it's visible in the new week, otherwise the week's first day.
  useEffect(() => {
    const idx = weekDates.findIndex((d) => d.isToday);
    setSelectedDayIdx(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartDate]);

  useEffect(() => {
    if (popup && popupInputRef.current) popupInputRef.current.focus();
  }, [popup]);

  useEffect(() => {
    if (!drag) return;
    const onUp = (e) => {
      if (!eventsRef.current) return;
      const rect = eventsRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(CAL_H, e.clientY - rect.top));
      const dy = Math.abs(y - drag.startY);
      const startMin = snapMin(yToMin(dy > 10 ? Math.min(drag.startY, y) : drag.startY));
      const rawEnd = dy > 10 ? yToMin(Math.max(drag.startY, y)) : yToMin(drag.startY) + 60;
      const endMin = snapMin(Math.min(rawEnd, CAL_END_MIN));
      setDrag(null);
      setPopup(buildPopupState({
        mode: 'add',
        dayLabel: weekDates[drag.dayIdx].label,
        startMin,
        endMin: Math.max(endMin, startMin + 30),
      }));
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, [drag, weekDates]);

  const moveDragActive = moveDrag !== null;
  useEffect(() => {
    if (!moveDragActive) return;
    const onMove = (e) => {
      if (!eventsRef.current) return;
      const rect = eventsRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(CAL_H, e.clientY - rect.top));
      const dayIdx = resolveDayIdxFromX(e.clientX);
      setMoveDrag((prev) => prev ? { ...prev, currentY: y, dayIdx } : null);
    };
    const onUp = () => {
      const cur = moveDragRef.current;
      if (!cur) return;
      const newStartMin = Math.max(0, Math.min(CAL_END_MIN - cur.duration, snapMin(yToMin(cur.currentY - cur.grabOffsetY))));
      const newEndMin = newStartMin + cur.duration;
      const newDay = weekDates[cur.dayIdx]?.label || cur.origDay;
      onUpdateTodo(cur.id, { startMin: newStartMin, endMin: newEndMin, day: newDay });
      setMoveDrag(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [moveDragActive, weekDates, onUpdateTodo]);

  const colW = 100 / 7;
  const timeColWidth = isMobile ? 26 : 72;

  const s = weekDates[0];
  const e = weekDates[6];
  const dateRange = s.month === e.month
    ? `${s.month}월 ${s.date}일 - ${e.date}일`
    : `${s.month}월 ${s.date}일 - ${e.month}월 ${e.date}일`;

  const resolveDayIdxFromX = (clientX) => {
    if (!eventsRef.current) return 0;
    const rect = eventsRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(6, Math.max(0, Math.floor(x / (rect.width / 7))));
  };

  const getEvtCoords = (ev) => {
    const rect = eventsRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(CAL_H, ev.clientY - rect.top));
    return { x: ev.clientX - rect.left, y, dayIdx: resolveDayIdxFromX(ev.clientX) };
  };

  const handleEventsMouseMove = (ev) => {
    if (!eventsRef.current) return;
    if (moveDrag) return;
    if (ev.target.closest('[data-todo-block]')) {
      if (drag) {
        const rect = eventsRef.current.getBoundingClientRect();
        setDrag((prev) => ({ ...prev, currentY: Math.max(0, Math.min(CAL_H, ev.clientY - rect.top)) }));
      }
      setHoveredCol(-1);
      return;
    }
    const { y, dayIdx } = getEvtCoords(ev);
    setHoveredCol(dayIdx);
    // Snap the hover "+" button to the hour grid (rather than following the
    // raw cursor position) so it lines up with the hour gridlines.
    const snappedMin = Math.min(CAL_END_MIN - 60, Math.round(yToMin(y) / 60) * 60);
    setHoveredY(minToY(snappedMin));
    if (drag) setDrag((prev) => ({ ...prev, currentY: y }));
  };

  const handleEventsMouseDown = (ev) => {
    if (ev.target.closest('[data-todo-block]') || !eventsRef.current) return;
    ev.preventDefault();
    const { y, dayIdx } = getEvtCoords(ev);
    setDrag({ dayIdx, startY: y, currentY: y });
  };

  const handleBlockMouseDown = (ev, todo, startMin, endMin) => {
    ev.stopPropagation();
    ev.preventDefault();
    if (!eventsRef.current) return;
    const rect = eventsRef.current.getBoundingClientRect();
    const y = ev.clientY - rect.top;
    const dayIdx = resolveDayIdxFromX(ev.clientX);
    setMoveDrag({
      id: todo.id,
      duration: endMin - startMin,
      grabOffsetY: y - minToY(startMin),
      dayIdx,
      currentY: y,
      origDay: todo.day,
      origStartMin: startMin,
      origEndMin: endMin,
    });
  };

  const popupTimeInvalid = popup != null && popup.endMin <= popup.startMin;
  const popupCanSubmit = Boolean(
    popup?.title.trim()
    && popup.selectedDays.length > 0
    && !popupTimeInvalid,
  );

  const submitPopup = () => {
    if (!popup || !popupCanSubmit) return;
    if (popup.mode === 'edit') {
      onUpdateTodo(popup.id, {
        title: popup.title.trim(),
        cat: popup.category,
        startMin: popup.startMin,
        endMin: popup.endMin,
        done: popup.done,
        day: popup.selectedDays[0],
      });
      setPopup(null);
      return;
    }
    const eventDates = Object.fromEntries(
      popup.selectedDays.map((label) => {
        const match = weekDates.find((d) => d.label === label);
        return [label, match ? formatDateParam(match.fullDate) : formatDateParam(getNow())];
      }),
    );
    onAddTodo(popup.title.trim(), popup.selectedDays[0], popup.startMin, popup.endMin, {
      days: popup.selectedDays,
      repeatWeekly: popup.repeatWeekly,
      category: popup.category,
      eventDates,
    });
    setPopup(null);
  };

  const togglePopupDay = (label) => {
    setPopup((prev) => {
      if (!prev) return prev;
      const has = prev.selectedDays.includes(label);
      const nextDays = has
        ? (prev.selectedDays.length > 1 ? prev.selectedDays.filter((d) => d !== label) : prev.selectedDays)
        : [...prev.selectedDays, label];
      return { ...prev, selectedDays: nextDays };
    });
  };

  const formatHourSlot = (hour) => {
    if (isMobile) {
      if (hour === 0) return '00h';
      if (hour === 24) return '24h';
      return `${String(hour).padStart(2, '0')}h`;
    }
    if (hour === 0) return '00:00';
    if (hour === 24) return '24:00';
    return `${String(hour).padStart(2, '0')}:00`;
  };

  // Build TIME_SLOTS array from 0..24
  const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => formatHourSlot(i));

  return (
    <div className="page-stack" style={{ paddingBottom: 32 }}>
      <section className="hero card">
        <div>
          <h2>{agentReport?.headline || '주간 계획 리포트'}</h2>
          <p>{agentReport?.body?.trim() ? agentReport.body : '리포트 준비 중입니다.'}</p>
        </div>
      </section>

      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 bg-white rounded-3xl shadow-sm border border-slate-100 weekly-plan-shell${isMobile ? ' weekly-plan-shell--mobile' : ' p-8'}`}>

        {/* Left: Calendar (3 cols) */}
        <div className="lg:col-span-3">
          <DateNavigatorBar
            mode="week"
            label={dateRange}
            rangeStartDate={weekStartDate}
            onPrevDay={() => setWeekStartDate((d) => addCalendarDays(d, -1))}
            onPrevWeek={() => setWeekStartDate((d) => addCalendarDays(d, -7))}
            onNextWeek={() => setWeekStartDate((d) => addCalendarDays(d, 7))}
            onNextDay={() => setWeekStartDate((d) => addCalendarDays(d, 1))}
            onSelectWeek={(date) => setWeekStartDate(normalizeDate(date))}
            showTodayReset={!isSameDay(weekStartDate, getToday())}
            onTodayReset={() => setWeekStartDate(getToday())}
            className={isMobile ? 'mb-4' : 'mb-8'}
          />

          <div className="relative">
            <div>
              <div>

                {/* Sticky day header */}
                <div className={`weekly-plan-sticky-header sticky top-0 bg-white pb-2${isMobile ? ' weekly-plan-sticky-header--mobile' : ''}`} style={{ zIndex: 50, borderBottom: '1px solid #f1f5f9' }}>
                  <div className="grid" style={{ gridTemplateColumns: `${timeColWidth}px repeat(7, 1fr)` }}>
                    <div />
                    {weekDates.map((d, i) => {
                      const isSunday = d.label === '일';
                      return (
                      <button
                        key={`${d.label}-${d.date}`}
                        type="button"
                        onClick={() => setSelectedDayIdx(i)}
                        className="text-center py-2 rounded-lg transition-colors"
                        style={{ background: i === selectedDayIdx ? '#eff6ff' : 'transparent' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: d.isToday ? '#2563eb' : isSunday ? '#dc2626' : '#64748b' }}>{d.label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: d.isToday ? '#2563eb' : isSunday ? '#dc2626' : '#1e293b' }}>{d.date}</p>
                      </button>
                    );})}
                  </div>
                </div>

                {/* Calendar body */}
                <div className={`grid pt-3${isMobile ? ' weekly-plan-calendar-grid--mobile' : ''}`} style={{ gridTemplateColumns: `${timeColWidth}px 1fr` }}>
                  {/* Time labels */}
                  <div
                    className={`relative font-semibold text-slate-400${isMobile ? ' weekly-plan-time-col--mobile' : ' text-xs'}`}
                    style={{ height: `${CAL_H}px` }}
                  >
                    {TIME_SLOTS.map((t, i) => {
                      const y = minToY(i * 60);
                      return (
                        <div
                          key={t}
                          style={{
                            position: 'absolute',
                            top: y,
                            left: isMobile ? 0 : undefined,
                            right: isMobile ? undefined : 8,
                            transform: i === 0 ? 'none' : 'translateY(-50%)',
                            lineHeight: 1,
                          }}
                        >
                          {t}
                        </div>
                      );
                    })}
                  </div>

                  {/* Events area */}
                  <div
                    ref={eventsRef}
                    className="relative w-full"
                    style={{ height: `${CAL_H}px`, userSelect: 'none', cursor: moveDrag ? 'grabbing' : drag ? 'ns-resize' : 'default' }}
                    onMouseMove={handleEventsMouseMove}
                    onMouseDown={handleEventsMouseDown}
                    onDragStart={(ev) => ev.preventDefault()}
                    onMouseLeave={() => { if (!moveDrag) setHoveredCol(-1); }}
                  >
                    {/* Today column highlight */}
                    {weekDates.map((d, i) => d.isToday && (
                      <div key="today-bg" style={{ position: 'absolute', left: `${i * colW}%`, width: `${colW}%`, top: 0, bottom: 0, background: 'rgba(37,99,235,0.03)', pointerEvents: 'none', zIndex: 0 }} />
                    ))}

                    {/* Current time line */}
                    {weekDates.map((d, i) => d.isToday && (
                      <div key="now-line" style={{ position: 'absolute', left: `${i * colW}%`, width: `${colW}%`, top: minToY(nowMin), height: 2, background: '#94a3b8', pointerEvents: 'none', zIndex: 15 }}>
                        <div style={{ position: 'absolute', left: -3, top: -3, width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                      </div>
                    ))}

                    {/* Hour gridlines */}
                    {Array.from({ length: 23 }, (_, i) => (
                      <div
                        key={`hr-${i}`}
                        style={{
                          position: 'absolute',
                          top: minToY((i + 1) * 60),
                          left: 0,
                          right: 0,
                          height: 1,
                          background: '#f4f6f8',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                    ))}

                    {/* Column dividers */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(i + 1) * colW}%`,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          background: '#f1f5f9',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                    ))}

                    {/* Drag selection highlight */}
                    {drag && Math.abs(drag.currentY - drag.startY) > 5 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${drag.dayIdx * colW + 1}%`,
                          width: `${colW - 2}%`,
                          top: Math.min(drag.startY, drag.currentY),
                          height: Math.abs(drag.currentY - drag.startY),
                          background: 'rgba(37,99,235,0.08)',
                          border: '1.5px dashed #93c5fd',
                          borderRadius: '8px',
                          pointerEvents: 'none',
                          zIndex: 5,
                        }}
                      />
                    )}

                    {/* Hover + button */}
                    {hoveredCol >= 0 && !drag && (
                      <button
                        type="button"
                        onMouseDown={(ev) => ev.stopPropagation()}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const startMin = snapMin(yToMin(hoveredY));
                          setPopup(buildPopupState({
                            mode: 'add',
                            dayLabel: weekDates[hoveredCol].label,
                            startMin,
                            endMin: snapMin(startMin + 60),
                          }));
                        }}
                        style={{
                          position: 'absolute',
                          left: `${hoveredCol * colW + colW / 2}%`,
                          top: hoveredY,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 25,
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: 'white',
                          border: '1.5px solid #93c5fd',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    )}

                    {/* Todo blocks */}
                    {(() => {
                      const CAT_ORDER = { '자세': 0, '수면': 1, '식습관': 2, '멘탈': 3 };
                      return weekDates.flatMap((d, dayIdx) => {
                        const dayTodos = todos.filter((t) => t.day === d.label);
                        const sorted = [...dayTodos].sort((a, b) => {
                          const aMin = a.startMin ?? CAT_STYLE[a.cat]?.defaultMin ?? 540;
                          const bMin = b.startMin ?? CAT_STYLE[b.cat]?.defaultMin ?? 540;
                          if (aMin !== bMin) return aMin - bMin;
                          return (CAT_ORDER[a.cat] ?? 4) - (CAT_ORDER[b.cat] ?? 4);
                        });
                        let nextY = 0;
                        return sorted.map((todo) => {
                          const cs = CAT_STYLE[todo.cat] || CAT_STYLE['멘탈'];
                          const startMin = todo.startMin ?? cs.defaultMin ?? 540;
                          const endMin = todo.endMin ?? (startMin + 30);
                          const idealTop = minToY(startMin);
                          const height = Math.max(isMobile ? 34 : 46, minToY(endMin) - idealTop);
                          const top = Math.max(idealTop, nextY);
                          nextY = top + height + (isMobile ? 2 : 3);
                          const isBeingMoved = moveDrag?.id === todo.id;
                          return (
                            <div
                              key={todo.id}
                              data-todo-block="true"
                              className={`absolute rounded-xl${isMobile ? ' px-1 py-0.5' : ' px-2 py-1.5'}`}
                              style={{
                                top,
                                height,
                                left: `${dayIdx * colW + 1}%`,
                                width: `${colW - 2}%`,
                                background: cs.bg,
                                color: cs.text,
                                boxShadow: `0 2px 6px ${cs.shadow}`,
                                zIndex: 20,
                                overflow: 'hidden',
                                cursor: 'grab',
                                opacity: isBeingMoved ? 0.25 : 1,
                                transition: isBeingMoved ? 'none' : 'opacity 0.1s',
                                borderRadius: 12,
                              }}
                              onMouseDown={(ev) => handleBlockMouseDown(ev, todo, startMin, endMin)}
                              onClick={(ev) => {
                                if (moveDrag) return;
                                ev.stopPropagation();
                                setPopup(buildPopupState({
                                  mode: 'edit',
                                  id: todo.id,
                                  title: todo.title,
                                  done: todo.done,
                                  cat: todo.cat,
                                  dayLabel: todo.day,
                                  startMin,
                                  endMin,
                                  selectedDays: todo.days?.length ? todo.days : [todo.day],
                                  repeatWeekly: todo.repeatWeekly ?? todo.scheduleKind === 'weekly',
                                }));
                              }}
                            >
                              <p
                                className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} font-medium leading-tight`}
                                style={{ textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.55 : 1, whiteSpace: 'normal', wordBreak: 'break-all' }}
                              >
                                {todo.title}
                              </p>
                            </div>
                          );
                        });
                      });
                    })()}

                    {/* Floating block during drag-to-move */}
                    {moveDrag && (() => {
                      const todo = todos.find((t) => t.id === moveDrag.id);
                      if (!todo) return null;
                      const cs = CAT_STYLE[todo.cat] || CAT_STYLE['멘탈'];
                      const newStartMin = Math.max(0, Math.min(CAL_END_MIN - moveDrag.duration, snapMin(yToMin(moveDrag.currentY - moveDrag.grabOffsetY))));
                      const blockTop = minToY(newStartMin);
                      const height = Math.max(isMobile ? 34 : 46, minToY(newStartMin + moveDrag.duration) - blockTop);
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: blockTop,
                            height,
                            left: `${moveDrag.dayIdx * colW + 1}%`,
                            width: `${colW - 2}%`,
                            background: cs.bg,
                            color: cs.text,
                            boxShadow: `0 8px 24px ${cs.shadow}, 0 0 0 2px ${cs.text}22`,
                            zIndex: 30,
                            borderRadius: 12,
                            padding: '6px 8px',
                            pointerEvents: 'none',
                            opacity: 0.95,
                            overflow: 'hidden',
                          }}
                        >
                          <p className="text-[11px] font-medium leading-snug" style={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>{todo.title}</p>
                          <p className="text-[9px] opacity-60 mt-0.5">{fmtTime(newStartMin)} ~ {fmtTime(newStartMin + moveDrag.duration)}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-1 lg:border-l border-slate-100 lg:pl-6 flex flex-col gap-6">
          {/* Selected day's todos (defaults to today) */}
          {(() => {
            const selectedDate = weekDates[selectedDayIdx] || weekDates[0];
            const heading = selectedDate.isToday ? '오늘 할 일' : `${selectedDate.month}월 ${selectedDate.date}일 할 일`;
            const emptyLabel = selectedDate.isToday ? '오늘' : `${selectedDate.month}월 ${selectedDate.date}일`;
            const dayTodos = todos.filter((t) => t.day === selectedDate.label);
            const doneCount = dayTodos.filter((t) => t.done).length;
            const remaining = dayTodos.length - doneCount;
            return (
              <div className="bg-slate-50 rounded-2xl p-4 min-h-[120px]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-800 text-sm">{heading}</h2>
                  {dayTodos.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: remaining > 0 ? '#dbeafe' : '#dcfce7', color: remaining > 0 ? '#0294d8' : '#15803d' }}>
                      {remaining > 0 ? `${remaining}개 남음` : '모두 완료!'}
                    </span>
                  )}
                </div>
                {dayTodos.length > 0 && <p className="text-xs text-slate-400 mb-2">{doneCount}/{dayTodos.length}개 완료</p>}
                <div className="space-y-1.5">
                  {dayTodos.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{emptyLabel} 일정이 없습니다</p>}
                  {dayTodos.map((t) => {
                    const cs = CAT_STYLE[t.cat] || CAT_STYLE['멘탈'];
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer transition-all"
                        style={{ background: t.done ? '#f8fafc' : 'white', opacity: t.done ? 0.6 : 1 }}
                        onClick={() => onToggleTodo(t.id)}
                      >
                        <div className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center" style={{ background: t.done ? '#94a3b8' : cs.bg, border: t.done ? 'none' : `1.5px solid ${cs.text}40` }}>
                          {t.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <p className="text-xs flex-1 min-w-0 leading-snug" style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#94a3b8' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.title}
                        </p>
                        {t.startMin !== undefined && (
                          <span className="text-[10px] shrink-0" style={{ color: '#94a3b8' }}>{fmtTime(t.startMin)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* AI recommended actions */}
          {recommendationGroups.some((group) => group.items?.length > 0) && (
          <div>
            <h2 className="font-bold text-slate-800 text-sm mb-3">AI 맞춤 추천 계획</h2>
            <div className="pr-1">
              {(() => {
                return recommendationGroups.map(({ key, label, items }) => {
                  const visible = items.filter((item) => !dismissed.has(item.id));
                  if (visible.length === 0) return null;
                  return (
                    <div key={key} className="mb-4">
                      <h3 className="text-xs font-bold text-slate-600 mb-1.5 px-1">{label}</h3>
                      <div className="space-y-1.5">
                        {visible.map((item) => {
                          const isApproved = item.approved || todos.some((todo) => todo.sourceInsightId === item.id);
                          const isUpdating = updatingRecommendationId === item.id;
                          const isHovering = isApproved && hoverApprovedId === item.id;
                          return (
                            <div key={item.id} className="group flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="flex-1 min-w-0 text-xs text-slate-700 leading-snug">{item.title}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                {isApproved ? (
                                  <button
                                    type="button"
                                    onMouseEnter={() => setHoverApprovedId(item.id)}
                                    onMouseLeave={() => setHoverApprovedId(null)}
                                    onClick={() => toggleRecommendation(item.id)}
                                    disabled={isUpdating}
                                    className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
                                    style={{ background: isHovering ? '#fee2e2' : '#dcfce7', color: isHovering ? '#dc2626' : '#16a34a', opacity: isUpdating ? 0.6 : 1 }}
                                  >
                                    {isUpdating ? '처리 중' : isHovering ? '제거' : '추가됨'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleRecommendation(item.id)}
                                    disabled={isUpdating}
                                    className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                                    style={{ background: '#f1f5f9', color: '#64748b', opacity: isUpdating ? 0.6 : 1 }}
                                    onMouseEnter={(ev) => { ev.currentTarget.style.background = '#dbeafe'; ev.currentTarget.style.color = '#2563eb'; }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.background = '#f1f5f9'; ev.currentTarget.style.color = '#64748b'; }}
                                  >
                                    {isUpdating ? '처리 중' : '추가'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDismissed((prev) => new Set([...prev, item.id]))}
                                  className="p-0.5 rounded transition-opacity opacity-0 group-hover:opacity-100"
                                  style={{ color: '#cbd5e1' }}
                                  onMouseEnter={(ev) => { ev.currentTarget.style.color = '#64748b'; }}
                                  onMouseLeave={(ev) => { ev.currentTarget.style.color = '#cbd5e1'; }}
                                  aria-label="삭제"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          )}

          {/* 목표 기반 습관 코칭 */}
          <div>
            <h2 className="font-bold text-slate-800 text-sm mb-3">목표 코칭</h2>
            {!activeGoal ? (
              <div className="goal-coach-card">
                <p>이루고 싶은 목표를 적어보세요. WaveAI가 당신의 목표를 지원해드릴게요.</p>
                <textarea
                  ref={goalTextareaRef}
                  className="goal-coach-textarea"
                  rows={1}
                  value={goalTitleInput}
                  onChange={(e) => {
                    setGoalTitleInput(e.target.value);
                    growGoalTextarea(e.target);
                  }}
                  placeholder="예: 취침 11시 전에 자기"
                />
                <div className="goal-coach-tags">
                  {GOAL_CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`goal-coach-tag${goalCategoryInput === opt.value ? ' is-active' : ''}`}
                      onClick={() => setGoalCategoryInput(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={submitGoal}
                  disabled={!goalTitleInput.trim() || goalFormBusy}
                  className="goal-coach-submit"
                  style={{ opacity: !goalTitleInput.trim() || goalFormBusy ? 0.65 : 1 }}
                >
                  {goalFormBusy && <span className="goal-coach-spinner" aria-hidden="true" />}
                  {goalFormBusy ? '맞춤 계획 생성 중…' : '목표 설정'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: '#dbeafe', color: '#2cb3f1' }}
                  >
                    {GOAL_CATEGORY_OPTIONS.find((opt) => opt.value === activeGoal.category)?.label || activeGoal.category}
                  </span>
                  <p className="flex-1 min-w-0 text-xs font-medium text-slate-700 truncate">{activeGoal.title}</p>
                  <button
                    type="button"
                    onClick={archiveActiveGoal}
                    disabled={goalFormBusy}
                    className="p-0.5 rounded shrink-0"
                    style={{ color: '#cbd5e1' }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.color = '#64748b'; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.color = '#cbd5e1'; }}
                    aria-label="목표 보관"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {goalCoaching && (
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed">{goalCoaching.pastSummary}</p>
                    {goalCoaching.projectedMetrics?.completionRate !== undefined && (
                      <p className="text-xs font-semibold" style={{ color: '#2cb3f1' }}>
                        완료율 {Math.round(goalCoaching.projectedMetrics.completionRate * 100)}%
                        {goalCoaching.projectedMetrics.trend && ` · ${GOAL_TREND_LABEL[goalCoaching.projectedMetrics.trend] || goalCoaching.projectedMetrics.trend}`}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2">{goalCoaching.projection}</p>
                  </div>
                )}

                {goalCoaching?.recommendations?.some((item) => !goalDismissed.has(item.id)) && (
                  <div className="space-y-1.5">
                    {goalCoaching.recommendations.filter((item) => !goalDismissed.has(item.id)).map((item) => {
                      const isBusy = goalRecBusyId === item.id;
                      return (
                        <div key={item.id} className="group flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-snug">{item.title}</p>
                            {item.text && (
                              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.text}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.actionable && (
                              <button
                                type="button"
                                onClick={() => toggleGoalRecommendation(item)}
                                disabled={isBusy}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
                                style={
                                  item.approved
                                    ? { background: '#dcfce7', color: '#16a34a', opacity: isBusy ? 0.6 : 1 }
                                    : { background: '#f1f5f9', color: '#64748b', opacity: isBusy ? 0.6 : 1 }
                                }
                              >
                                {isBusy ? '처리 중' : item.approved ? '적용됨' : '추가'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setGoalDismissed((prev) => new Set([...prev, item.id]))}
                              className="p-0.5 rounded transition-opacity opacity-0 group-hover:opacity-100"
                              style={{ color: '#cbd5e1' }}
                              onMouseEnter={(ev) => { ev.currentTarget.style.color = '#64748b'; }}
                              onMouseLeave={(ev) => { ev.currentTarget.style.color = '#cbd5e1'; }}
                              aria-label="삭제"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add / edit plan popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ background: 'rgba(0,0,0,0.15)', paddingTop: '18vh' }}
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 mx-4"
            style={{ width: '100%', maxWidth: '520px' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {popup.mode === 'edit' ? '계획 수정' : '새 계획 추가'}
              </h3>
              <button type="button" onClick={() => setPopup(null)} className="p-1 rounded-lg" style={{ color: '#94a3b8' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="plan-add-title-wrap mb-4">
              <div className="plan-add-time-warn" role="status" aria-live="polite">
                {popupTimeInvalid ? '종료 시간은 시작 시간보다 이후여야 합니다.' : ''}
              </div>
              <label className="plan-add-label" htmlFor="plan-add-title">제목</label>
              <div className="plan-add-title-row">
                <input
                  id="plan-add-title"
                  ref={popupInputRef}
                  type="text"
                  value={popup.title}
                  onChange={(ev) => setPopup((prev) => ({ ...prev, title: ev.target.value }))}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') submitPopup(); if (ev.key === 'Escape') setPopup(null); }}
                  placeholder="어떤 계획을 세울까요?"
                  className="plan-add-title-input"
                />
                <button
                  type="button"
                  onClick={submitPopup}
                  disabled={!popupCanSubmit}
                  className="plan-add-submit"
                  aria-label={popup.mode === 'edit' ? '계획 저장' : '계획 추가'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">시작</p>
                  <TimeWheelPicker
                    compact
                    hour12={popup.startPicker.hour12}
                    minute={popup.startPicker.minute}
                    meridiem={popup.startPicker.meridiem}
                    onChange={(next) => {
                      const startMin = pickerStateToMinutes(next);
                      setPopup((prev) => ({
                        ...prev,
                        startPicker: next,
                        startMin,
                      }));
                    }}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">종료</p>
                  <TimeWheelPicker
                    compact
                    hour12={popup.endPicker.hour12}
                    minute={popup.endPicker.minute}
                    meridiem={popup.endPicker.meridiem}
                    onChange={(next) => {
                      const endMin = pickerStateToMinutes(next);
                      setPopup((prev) => ({
                        ...prev,
                        endPicker: next,
                        endMin,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="plan-add-label">요일</label>
              <div className="plan-add-days-stack">
                <div className="flex gap-1.5 flex-wrap">
                  {PLAN_WEEKDAYS.map((label) => {
                    const selected = popup.selectedDays.includes(label);
                    const isSunday = label === '일';
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => togglePopupDay(label)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: selected ? '#2563eb' : '#f1f5f9',
                          color: selected ? 'white' : (isSunday ? '#dc2626' : '#64748b'),
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <label className="plan-add-repeat">
                  <input
                    type="checkbox"
                    checked={popup.repeatWeekly}
                    onChange={(ev) => setPopup((prev) => ({ ...prev, repeatWeekly: ev.target.checked }))}
                  />
                  매 주 반복
                </label>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-2">카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(PLAN_CAT_STYLE).map(([cat, cs]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPopup((prev) => ({ ...prev, category: cat }))}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: popup.category === cat ? cs.bg : '#f8fafc',
                      color: popup.category === cat ? cs.text : '#94a3b8',
                      border: `1.5px solid ${popup.category === cat ? cs.bg : '#f1f5f9'}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {popup.mode === 'edit' && (
              <button
                type="button"
                onClick={() => setPopup((prev) => ({ ...prev, done: !prev.done }))}
                className="w-full py-2 text-sm font-semibold rounded-xl mt-3 transition-colors"
                style={{
                  background: popup.done ? '#f1f5f9' : (PLAN_CAT_STYLE[popup.category]?.bg || '#dbeafe'),
                  color: popup.done ? '#64748b' : (PLAN_CAT_STYLE[popup.category]?.text || '#1d4ed8'),
                }}
              >
                {popup.done ? '↩ 완료 취소' : '✓ 완료 표시'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
