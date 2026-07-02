import { useState, useMemo, useRef, useEffect } from 'react';
import { useApprovedActions } from '../context/ApprovedActionsContext';
import {
  CAT_STYLE, ENG_LABELS, CAL_H, CAL_END_MIN,
  minToY, yToMin, snapMin, fmtTime, pickAICat, getWeekDates,
} from '../data/weeklyPlanData';
import { sleepDailyInsights, sleepWeeklyInsights } from '../data/sleepData';
import { postureDailyInsights, postureWeeklyInsights } from '../data/postureData';

const allRecommendedActions = [
  ...sleepDailyInsights,
  ...sleepWeeklyInsights,
  ...postureDailyInsights,
  ...postureWeeklyInsights,
];

export function WeeklyPlanPage({ todos, onToggleTodo, onAddTodo, onUpdateTodo }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const { approved, toggle } = useApprovedActions();
  const [dismissed, setDismissed] = useState(() => new Set());
  const [hoverApprovedId, setHoverApprovedId] = useState(null);
  const [detailTodo, setDetailTodo] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(-1);
  const [hoveredY, setHoveredY] = useState(0);
  const [drag, setDrag] = useState(null);
  const [moveDrag, setMoveDrag] = useState(null);
  const [popup, setPopup] = useState(null);
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });
  const eventsRef = useRef(null);
  const popupInputRef = useRef(null);
  const moveDragRef = useRef(null);
  moveDragRef.current = moveDrag;

  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

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
      setPopup({ dayIdx: drag.dayIdx, dayLabel: weekDates[drag.dayIdx].label, startMin, endMin: Math.max(endMin, startMin + 30), title: '' });
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
      const dayIdx = Math.min(6, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 7))));
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
  const s = weekDates[0];
  const e = weekDates[6];
  const dateRange = s.month === e.month
    ? `${s.month}월 ${s.date}일 - ${e.date}일`
    : `${s.month}월 ${s.date}일 - ${e.month}월 ${e.date}일`;

  const getEvtCoords = (ev) => {
    const rect = eventsRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = Math.max(0, Math.min(CAL_H, ev.clientY - rect.top));
    const dayIdx = Math.min(6, Math.max(0, Math.floor(x / (rect.width / 7))));
    return { x, y, dayIdx };
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
    setHoveredY(y);
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
    const dayIdx = Math.min(6, Math.max(0, Math.floor((ev.clientX - rect.left) / (rect.width / 7))));
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

  const submitPopup = () => {
    if (!popup?.title.trim()) return;
    const cat = pickAICat(popup.title);
    onAddTodo(popup.title.trim(), popup.dayLabel, cat, popup.startMin, popup.endMin);
    setPopup(null);
  };

  const gridLines = Array.from({ length: 49 }, (_, i) => ({
    y: i * (CAL_H / 48),
    isHour: i % 2 === 0,
  }));

  const nightOverlays = useMemo(() => {
    const MORNING_END = 7 * 60;
    const MIN_EVE = 18 * 60;
    const DEFAULT_NIGHT = 23 * 60;
    const overlays = [];
    const morningAdded = new Set();

    weekDates.forEach((d, i) => {
      if (!d.isPast) return;
      const eveTodos = todos.filter(
        (t) => t.day === d.label && t.cat === '수면' && (t.startMin ?? 0) >= MIN_EVE
      );
      const nightStart = eveTodos.length > 0
        ? Math.min(...eveTodos.map((t) => t.startMin))
        : DEFAULT_NIGHT;

      overlays.push({ dayIdx: i, startMin: nightStart, endMin: CAL_END_MIN, edge: 'night', nightStart });

      const j = i + 1;
      if (j < weekDates.length && !morningAdded.has(j)) {
        const nextPast = weekDates[j].isPast;
        const nextTodayPastMorning = weekDates[j].isToday && nowMin >= MORNING_END;
        if (nextPast || nextTodayPastMorning) {
          overlays.push({ dayIdx: j, startMin: 0, endMin: MORNING_END, edge: 'morning', nightStart });
          morningAdded.add(j);
        }
      }
    });

    if (weekDates[0]?.isPast && !morningAdded.has(0)) {
      overlays.push({ dayIdx: 0, startMin: 0, endMin: MORNING_END, edge: 'morning', nightStart: DEFAULT_NIGHT });
    }

    return overlays;
  }, [todos, weekDates, nowMin]);

  // Build TIME_SLOTS array from 0..23
  const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
    if (i === 0) return '00:00';
    if (i === 24) return '24:00';
    return `${String(i).padStart(2, '0')}:00`;
  });

  return (
    <div className="page-stack">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">

        {/* Left: Calendar (3 cols) */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">주간 헬스 플랜</h1>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <span>{dateRange}</span>
                <div className="flex gap-1 ml-2">
                  <button type="button" onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button type="button" onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                {weekOffset !== 0 && (
                  <button type="button" onClick={() => setWeekOffset(0)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">오늘</button>
                )}
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="overflow-y-auto" style={{ maxHeight: '720px' }}>

                {/* Sticky day header */}
                <div className="sticky top-0 bg-white pb-2" style={{ zIndex: 50, borderBottom: '1px solid #f1f5f9' }}>
                  <div className="grid" style={{ gridTemplateColumns: '72px repeat(7, 1fr)' }}>
                    <div />
                    {weekDates.map((d, i) => (
                      <div key={d.label} className="text-center py-2">
                        <p className="text-xs font-semibold" style={{ color: d.isToday ? '#2563eb' : '#94a3b8' }}>{ENG_LABELS[i]}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: d.isToday ? '#2563eb' : '#1e293b' }}>{d.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar body */}
                <div className="grid pt-3" style={{ gridTemplateColumns: '72px 1fr' }}>
                  {/* Time labels */}
                  <div className="relative text-xs font-semibold text-slate-400" style={{ height: `${CAL_H}px` }}>
                    {TIME_SLOTS.map((t, i) => {
                      const y = minToY(i * 60);
                      return (
                        <div
                          key={t}
                          style={{
                            position: 'absolute',
                            top: y,
                            right: 8,
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
                    {/* Night overlays */}
                    {nightOverlays.map(({ dayIdx, startMin, endMin, edge }, idx) => {
                      const top = minToY(startMin);
                      const height = minToY(endMin) - top;
                      const gradient = edge === 'night'
                        ? 'linear-gradient(to bottom, rgba(8,6,32,0) 0%, rgba(12,10,45,0.82) 14%, rgba(10,8,38,0.88) 100%)'
                        : 'linear-gradient(to bottom, rgba(10,8,38,0.88) 0%, rgba(12,10,45,0.82) 86%, rgba(8,6,32,0) 100%)';
                      return (
                        <div key={`night-${idx}`} style={{
                          position: 'absolute',
                          left: `${dayIdx * colW}%`,
                          width: `${colW}%`,
                          top,
                          height,
                          background: gradient,
                          pointerEvents: 'none',
                          zIndex: 3,
                          overflow: 'hidden',
                        }}>
                          {edge === 'night' && height > 30 && (
                            <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>
                              {fmtTime(startMin)} 취침
                            </div>
                          )}
                          {edge === 'morning' && height > 30 && (
                            <div style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>
                              {fmtTime(endMin)} 기상
                            </div>
                          )}
                        </div>
                      );
                    })}

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

                    {/* Grid lines */}
                    {gridLines.map(({ y, isHour }) => (
                      <div
                        key={y}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: y,
                          height: 1,
                          background: isHour ? '#e2e8f0' : '#f1f5f9',
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
                          setPopup({ dayIdx: hoveredCol, dayLabel: weekDates[hoveredCol].label, startMin, endMin: snapMin(startMin + 60), title: '' });
                        }}
                        style={{
                          position: 'absolute',
                          left: `${hoveredCol * colW + colW / 2}%`,
                          top: hoveredY,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 8,
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
                          const height = Math.max(46, minToY(endMin) - idealTop);
                          const top = Math.max(idealTop, nextY);
                          nextY = top + height + 3;
                          const isBeingMoved = moveDrag?.id === todo.id;
                          return (
                            <div
                              key={todo.id}
                              data-todo-block="true"
                              className="absolute rounded-xl px-2 py-1.5"
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
                                setDetailTodo({ ...todo, resolvedStartMin: startMin, resolvedEndMin: endMin });
                              }}
                            >
                              <p
                                className="text-[11px] font-medium leading-snug"
                                style={{ textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.55 : 1, whiteSpace: 'normal', wordBreak: 'keep-all' }}
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
                      const height = Math.max(46, minToY(newStartMin + moveDrag.duration) - blockTop);
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
          {/* Today's todos */}
          {(() => {
            const todayDate = weekDates.find((d) => d.isToday);
            if (!todayDate) return null;
            const todayTodos = todos.filter((t) => t.day === todayDate.label);
            const doneCount = todayTodos.filter((t) => t.done).length;
            const remaining = todayTodos.length - doneCount;
            return (
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-800 text-sm">오늘 할 일</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: remaining > 0 ? '#dbeafe' : '#dcfce7', color: remaining > 0 ? '#0294d8' : '#15803d' }}>
                    {remaining > 0 ? `${remaining}개 남음` : '모두 완료!'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{doneCount}/{todayTodos.length}개 완료</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {todayTodos.length === 0 && <p className="text-xs text-slate-400 text-center py-2">오늘 일정이 없습니다</p>}
                  {todayTodos.map((t) => {
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
          <div>
            <h2 className="font-bold text-slate-800 text-sm mb-3">AI 맞춤 추천 계획</h2>
            <div className="overflow-y-auto pr-1" style={{ maxHeight: '500px' }}>
              {(() => {
                const groups = allRecommendedActions.reduce((acc, item) => {
                  const existing = acc.find((g) => g.label === item.label);
                  if (existing) existing.items.push(item);
                  else acc.push({ label: item.label, items: [item] });
                  return acc;
                }, []);
                return groups.map(({ label, items }) => {
                  const visible = items.filter((item) => !dismissed.has(item.id));
                  if (visible.length === 0) return null;
                  return (
                    <div key={label} className="mb-4">
                      <h3 className="text-xs font-bold text-slate-600 mb-1.5 px-1">{label}</h3>
                      <div className="space-y-1.5">
                        {visible.map((item) => {
                          const isApproved = approved[item.id];
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
                                    onClick={() => toggle(item.id)}
                                    className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
                                    style={{ background: isHovering ? '#fee2e2' : '#dcfce7', color: isHovering ? '#dc2626' : '#16a34a' }}
                                  >
                                    {isHovering ? '제거' : '적용됨'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggle(item.id)}
                                    className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}
                                    onMouseEnter={(ev) => { ev.currentTarget.style.background = '#dbeafe'; ev.currentTarget.style.color = '#2563eb'; }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.background = '#f1f5f9'; ev.currentTarget.style.color = '#64748b'; }}
                                  >
                                    승인
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
        </div>

      </div>

      {/* Todo detail / edit popup */}
      {detailTodo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.18)' }}
          onClick={() => setDetailTodo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-5 mx-4"
            style={{ width: '100%', maxWidth: '360px' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400">{detailTodo.day}요일</p>
              <button type="button" onClick={() => setDetailTodo(null)} className="p-1 rounded-lg" style={{ color: '#94a3b8' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">제목</label>
              <input
                type="text"
                value={detailTodo.title}
                onChange={(ev) => setDetailTodo((prev) => ({ ...prev, title: ev.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                style={{ borderColor: '#e2e8f0' }}
                onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
              />
            </div>

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={fmtTime(detailTodo.resolvedStartMin)}
                  onChange={(ev) => {
                    const [h, m] = ev.target.value.split(':').map(Number);
                    setDetailTodo((prev) => ({ ...prev, resolvedStartMin: h * 60 + m }));
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                  onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                  onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={fmtTime(detailTodo.resolvedEndMin)}
                  onChange={(ev) => {
                    const [h, m] = ev.target.value.split(':').map(Number);
                    setDetailTodo((prev) => ({ ...prev, resolvedEndMin: h * 60 + m }));
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                  onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                  onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-500 mb-2">카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CAT_STYLE).map(([cat, cs]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDetailTodo((prev) => ({ ...prev, cat }))}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: detailTodo.cat === cat ? cs.bg : '#f8fafc',
                      color: detailTodo.cat === cat ? cs.text : '#94a3b8',
                      border: `1.5px solid ${detailTodo.cat === cat ? cs.bg : '#f1f5f9'}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetailTodo((prev) => ({ ...prev, done: !prev.done }))}
              className="w-full py-2 text-sm font-semibold rounded-xl mb-3 transition-colors"
              style={{
                background: detailTodo.done ? '#f1f5f9' : CAT_STYLE[detailTodo.cat]?.bg,
                color: detailTodo.done ? '#64748b' : CAT_STYLE[detailTodo.cat]?.text,
              }}
            >
              {detailTodo.done ? '↩ 완료 취소' : '✓ 완료 표시'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDetailTodo(null)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTodo(detailTodo.id, {
                    title: detailTodo.title,
                    cat: detailTodo.cat,
                    startMin: detailTodo.resolvedStartMin,
                    endMin: detailTodo.resolvedEndMin,
                    done: detailTodo.done,
                  });
                  setDetailTodo(null);
                }}
                className="flex-1 py-2 text-sm font-semibold rounded-xl"
                style={{ background: CAT_STYLE[detailTodo.cat]?.bg, color: CAT_STYLE[detailTodo.cat]?.text }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add plan popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ background: 'rgba(0,0,0,0.15)', paddingTop: '18vh' }}
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 mx-4"
            style={{ width: '100%', maxWidth: '440px' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">새 계획 추가</h3>
              <button type="button" onClick={() => setPopup(null)} className="p-1 rounded-lg" style={{ color: '#94a3b8' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="mb-3 relative">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">제목</label>
              <input
                ref={popupInputRef}
                type="text"
                value={popup.title}
                onChange={(ev) => setPopup((prev) => ({ ...prev, title: ev.target.value }))}
                onKeyDown={(ev) => { if (ev.key === 'Enter') submitPopup(); if (ev.key === 'Escape') setPopup(null); }}
                placeholder="어떤 계획을 세울까요?"
                className="w-full px-4 py-3 pr-12 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                style={{ borderColor: '#e2e8f0' }}
                onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
              />
              <button
                type="button"
                onClick={submitPopup}
                className="absolute right-3 bottom-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: popup.title.trim() ? '#2563eb' : '#e2e8f0' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">요일</label>
              <div className="flex gap-1.5 flex-wrap">
                {weekDates.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setPopup((prev) => ({ ...prev, dayLabel: d.label }))}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: popup.dayLabel === d.label ? '#2563eb' : '#f1f5f9',
                      color: popup.dayLabel === d.label ? 'white' : '#64748b',
                    }}
                  >
                    {d.label} ({d.date})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={fmtTime(Math.min(popup.startMin, 23 * 60 + 59))}
                  onChange={(ev) => {
                    if (!ev.target.value) return;
                    const [h, m] = ev.target.value.split(':').map(Number);
                    const newStart = h * 60 + m;
                    setPopup((prev) => ({ ...prev, startMin: newStart, endMin: Math.max(prev.endMin, newStart + 30) }));
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                  onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                  onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={fmtTime(Math.min(popup.endMin, 23 * 60 + 59))}
                  onChange={(ev) => {
                    if (!ev.target.value) return;
                    const [h, m] = ev.target.value.split(':').map(Number);
                    const newEnd = h * 60 + m;
                    setPopup((prev) => ({ ...prev, endMin: Math.max(newEnd, prev.startMin + 30) }));
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 border focus:outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                  onFocus={(ev) => { ev.currentTarget.style.borderColor = '#93c5fd'; }}
                  onBlur={(ev) => { ev.currentTarget.style.borderColor = '#e2e8f0'; }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">AI가 카테고리를 자동으로 분류합니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
