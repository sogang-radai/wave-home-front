import { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';
import { DateNavigatorBar } from '../../components/calendar/DateNavigatorBar';
import { getToday, isSameDay, normalizeDate } from '../../components/calendar/calendarUtils';
import sleepApi from '../../api/sleepApi';
import './sleep.css';

function HeroNavChevron({ direction }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

const STAGE_COLORS = {
  awake: 'var(--accent-stage-awake)',
  rem: 'var(--accent-plum)',
  light: 'var(--accent-stage-light)',
  deep: 'var(--accent-stage-deep)',
};

const LANE_Y = { awake: 22, rem: 66, light: 110, deep: 154 };
const BLOCK_H = 42;
const CHART_W = 1000;
const CHART_H = 196;
const STAGE_RADIUS = 7;
const MOVEMENT_THRESHOLD = 10;

function average(values) {
  const nums = values.filter((value) => Number.isFinite(value));
  if (nums.length === 0) return 0;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function topRoundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

function buildHypnogramShapes(segments) {
  const total = segments.reduce((sum, seg) => sum + seg.durationMinutes, 0);
  let cursor = 0;
  const shapes = [];

  const points = segments.map((seg) => {
    const x0 = (cursor / total) * CHART_W;
    cursor += seg.durationMinutes;
    const x1 = (cursor / total) * CHART_W;
    return { x0, x1, stage: seg.stage, y: LANE_Y[seg.stage] ?? LANE_Y.awake };
  });

  points.forEach((pt, index) => {
    const width = Math.max(pt.x1 - pt.x0, 0.8);
    shapes.push({
      key: `h-${index}`,
      type: 'segment',
      d: topRoundedRectPath(pt.x0, pt.y - BLOCK_H / 2, width, BLOCK_H, STAGE_RADIUS),
      fill: STAGE_COLORS[pt.stage] ?? STAGE_COLORS.awake,
    });

    const prev = points[index - 1];
    if (prev && prev.y !== pt.y) {
      const top = Math.min(prev.y, pt.y) - BLOCK_H / 2;
      const height = Math.abs(pt.y - prev.y) + BLOCK_H;
      shapes.push({
        key: `v-${index}`,
        type: 'connector',
        x: pt.x0 - 3,
        y: top,
        width: 6,
        height,
        fill: STAGE_COLORS[pt.stage] ?? STAGE_COLORS.awake,
      });
    }
  });

  return { shapes, total };
}

function buildMovementTicks(movementLevels) {
  if (!movementLevels?.length) return [];

  return movementLevels
    .map((level, index) => {
      if (level < MOVEMENT_THRESHOLD) return null;
      return {
        key: `m-${index}`,
        left: ((index + 0.5) / movementLevels.length) * 100,
        opacity: 0.3 + (level / 100) * 0.6,
        height: 6 + (level / 100) * 6,
      };
    })
    .filter(Boolean);
}

export function SleepHypnogram({ segments, timeLabels, movementLevels }) {
  const { shapes } = buildHypnogramShapes(segments);
  const movementTicks = buildMovementTicks(movementLevels);

  return (
    <div className="sleep-hypnogram">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="sleep-hypnogram-chart" preserveAspectRatio="none">
        {[LANE_Y.awake, LANE_Y.rem, LANE_Y.light, LANE_Y.deep].map((y) => (
          <line key={y} x1="0" y1={y} x2={CHART_W} y2={y} className="sleep-hypnogram-grid" />
        ))}
        {shapes.map((shape) => (
          shape.type === 'segment' ? (
            <path key={shape.key} d={shape.d} fill={shape.fill} />
          ) : (
            <rect
              key={shape.key}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill}
            />
          )
        ))}
      </svg>

      <div className="sleep-movement-plot">
        <span className="sleep-movement-label">뒤척임</span>
        <div className="sleep-movement-line" />
        <div className="sleep-movement-ticks">
          {movementTicks.map((tick) => (
            <span
              key={tick.key}
              className="sleep-movement-tick"
              style={{
                left: `${tick.left}%`,
                height: `${tick.height}px`,
                opacity: tick.opacity,
              }}
            />
          ))}
        </div>
      </div>

      <div className="sleep-hypnogram-times">
        {timeLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function sleepScoreStatus(score) {
  if (score >= 85) return { cls: 'excellent', label: 'Excellent' };
  if (score >= 70) return { cls: 'good', label: 'Good' };
  if (score >= 55) return { cls: 'attention', label: 'Fair' };
  return { cls: 'danger', label: 'Bad' };
}

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toReportDateParam(uiDate) {
  const start = new Date(uiDate);
  start.setDate(start.getDate() - 1);
  return formatDateParam(start);
}

function formatHm(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

function formatClockLabel(iso) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
}

function buildHypnogramTimeLabels(start, end, divisions = 4) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Array.from({ length: divisions + 1 }, (_, i) => {
    const t = startMs + ((endMs - startMs) * i) / divisions;
    return formatClockLabel(new Date(t).toISOString());
  });
}

export function SleepStageBreakdownRow({ stage }) {
  const [typicalStart, typicalEnd] = stage.typicalPercentRange;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[stage.tone] }} />
        <strong className="text-[13px] font-extrabold text-[var(--ink)]">{stage.label}</strong>
        <em className="font-extrabold not-italic text-[var(--sub)]">{stage.percent}%</em>
        <small className="ml-auto text-[var(--sub)]">{stage.durationText}</small>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]"
          style={{ left: `${typicalStart}%`, width: `${typicalEnd - typicalStart}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${stage.percent}%`, background: STAGE_COLORS[stage.tone] }}
        />
      </div>
    </div>
  );
}

function SleepReportEmpty({ message }) {
  return (
    <div className="sleep-report-empty">
      <div className="sleep-report-empty-icon" aria-hidden="true">—</div>
      <p>{message}</p>
    </div>
  );
}

function resolveTransitionMode(leavingKind, enteringKind) {
  return leavingKind === 'report' && enteringKind === 'report' ? 'slide' : 'fade';
}

export function SleepStatusReport({ onReportDateChange }) {
  const [reportDate, setReportDate] = useState(getToday);
  const [latestDate] = useState(getToday);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('main');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transition, setTransition] = useState({
    phase: 'idle',
    dir: 0,
    leavingKind: 'empty',
    enteringKind: 'empty',
  });
  const prevNightDateRef = useRef(toReportDateParam(getToday()));
  const hasLoadedSessionsRef = useRef(false);
  const pendingDateRef = useRef(null);
  const pendingSessionRef = useRef(null);
  const pendingKindRef = useRef('date');
  const transitionRef = useRef(transition);
  const viewportRef = useRef(null);
  const [viewportMinH, setViewportMinH] = useState(0);
  transitionRef.current = transition;

  const reportNightDate = toReportDateParam(reportDate);
  const currentKind = report ? 'report' : 'empty';

  useEffect(() => {
    onReportDateChange?.(reportDate);
  }, [reportDate, onReportDateChange]);

  const navigateToDate = (nextDate) => {
    const normalized = normalizeDate(nextDate);
    if (isSameDay(normalized, reportDate)) return;
    if (normalized > latestDate) return;
    if (transition.phase !== 'idle') return;

    if (viewportRef.current && currentKind === 'report') {
      setViewportMinH(viewportRef.current.offsetHeight);
    }

    const dir = normalized.getTime() > reportDate.getTime() ? 1 : -1;
    pendingDateRef.current = normalized;
    pendingKindRef.current = 'date';
    setTransition({
      phase: 'exit',
      dir,
      leavingKind: currentKind,
      enteringKind: currentKind,
    });
  };

  const shiftDay = (delta) => {
    const next = new Date(reportDate);
    next.setDate(next.getDate() + delta);
    navigateToDate(next);
  };

  // 세션(주 수면/낮잠) 전환 — 날짜 전환과 같은 슬라이드 트랜지션을 재사용해
  // sleep-score-hero부터 수면 단계·코골이·심박·호흡 카드까지 전체가 스와핑되게 한다.
  const navigateToSession = (nextSessionId) => {
    if (nextSessionId === sessionId) return;
    if (transition.phase !== 'idle') return;
    const fromIndex = sessions.findIndex((s) => s.sessionId === sessionId);
    const toIndex = sessions.findIndex((s) => s.sessionId === nextSessionId);
    if (fromIndex === -1 || toIndex === -1) return;

    if (viewportRef.current && currentKind === 'report') {
      setViewportMinH(viewportRef.current.offsetHeight);
    }

    pendingSessionRef.current = nextSessionId;
    pendingKindRef.current = 'session';
    setTransition({
      phase: 'exit',
      dir: toIndex > fromIndex ? 1 : -1,
      leavingKind: currentKind,
      enteringKind: currentKind,
    });
  };

  const shiftSession = (delta) => {
    const index = sessions.findIndex((s) => s.sessionId === sessionId);
    if (index === -1) return;
    const next = sessions[index + delta];
    if (!next) return;
    navigateToSession(next.sessionId);
  };

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return;

    const current = transitionRef.current;
    if (current.phase === 'exit') {
      if (pendingKindRef.current === 'session') {
        const nextSessionId = pendingSessionRef.current;
        pendingSessionRef.current = null;
        setReport(null);
        setReportError(null);
        setSessionId(nextSessionId);
        setTransition({
          phase: 'loading',
          dir: current.dir,
          leavingKind: current.leavingKind,
          enteringKind: 'empty',
        });
        return;
      }

      const next = pendingDateRef.current;
      pendingDateRef.current = null;
      setSessions([]);
      setReport(null);
      setReportError(null);
      setReportDate(next);
      setTransition({
        phase: 'loading',
        dir: current.dir,
        leavingKind: current.leavingKind,
        enteringKind: 'empty',
      });
      return;
    }

    if (current.phase === 'enter') {
      setTransition({
        phase: 'idle',
        dir: 0,
        leavingKind: current.enteringKind,
        enteringKind: current.enteringKind,
      });
      setViewportMinH(0);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const dateChanged = prevNightDateRef.current !== reportNightDate;
    prevNightDateRef.current = reportNightDate;
    const shouldLoadSessions = dateChanged || !hasLoadedSessionsRef.current;

    setIsLoading(true);
    if (transition.phase === 'idle' && !dateChanged) {
      setReportError(null);
    }

    (async () => {
      let enteringKind = 'empty';

      try {
        let activeSessionId = sessionId;

        if (shouldLoadSessions) {
          const sessionData = await sleepApi.getDailySessions(reportNightDate);
          if (cancelled) return;
          setSessions(sessionData.sessions);
          hasLoadedSessionsRef.current = true;
          activeSessionId = sessionData.sessions[0]?.sessionId || 'main';
          if (activeSessionId !== sessionId) setSessionId(activeSessionId);
        }

        const reportData = await sleepApi.getDailyReport(reportNightDate, { sessionId: activeSessionId });
        if (cancelled) return;
        setReport(reportData);
        setReportError(null);
        enteringKind = 'report';
      } catch (err) {
        if (cancelled) return;
        if (shouldLoadSessions) setSessions([]);
        setReport(null);
        setReportError(err.message || '해당 날짜의 수면 기록이 없습니다.');
        enteringKind = 'empty';
      } finally {
        if (cancelled) return;
        setIsLoading(false);
        const nextEnteringKind = enteringKind;
        setTransition((current) => {
          if (current.phase !== 'loading') return current;
          return {
            phase: 'enter',
            dir: current.dir,
            leavingKind: current.leavingKind,
            enteringKind: nextEnteringKind,
          };
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportNightDate, sessionId]);

  const transitionMode = resolveTransitionMode(transition.leavingKind, transition.enteringKind);
  const contentPhaseClass = transition.phase === 'exit'
    ? 'is-fade-exit'
    : transition.phase === 'enter'
      ? (transitionMode === 'slide'
        ? (transition.dir > 0 ? 'is-enter-next' : 'is-enter-prev')
        : 'is-fade-enter')
      : '';

  const isTransitioning = transition.phase !== 'idle';
  const showSkeleton = transition.phase === 'loading'
    || (transition.phase === 'idle' && isLoading && !report && !reportError);
  const showContent = (report || reportError) && transition.phase !== 'loading';
  const labelFading = transition.phase === 'exit' || transition.phase === 'loading';
  const sessionLoading = transition.phase === 'idle' && isLoading && Boolean(report);

  const reportBody = report && (() => {
    const { cls, label } = sleepScoreStatus(report.score);
    const timeLabels = buildHypnogramTimeLabels(report.sleepWindow.start, report.sleepWindow.end);
    const avgHeart = average(report.stageLog.map((point) => point.heartRate));
    const avgBreath = average(report.stageLog.map((point) => point.breathRate));

    return (
      <>
        <section className={`sleep-score-hero ${cls}`}>
          {sessions.length > 1 && (
            <>
              <button
                type="button"
                className="sleep-hero-nav prev"
                aria-label="이전 수면 세션"
                onClick={() => shiftSession(-1)}
                disabled={sessions.findIndex((s) => s.sessionId === sessionId) <= 0}
              >
                <HeroNavChevron direction="prev" />
              </button>
              <button
                type="button"
                className="sleep-hero-nav next"
                aria-label="다음 수면 세션"
                onClick={() => shiftSession(1)}
                disabled={sessions.findIndex((s) => s.sessionId === sessionId) >= sessions.length - 1}
              >
                <HeroNavChevron direction="next" />
              </button>
            </>
          )}
          <div className="sleep-score-hero-top">
            <div className="sleep-score-hero-number">
              {report.score}<span className={`tag ${cls}`}>{label}</span>
            </div>
          </div>
          <div className="sleep-score-hero-times">
            <strong>{formatHm(report.timeInBedMinutes)}</strong>
            <span>수면 시간 · {formatClockLabel(report.sleepWindow.start)} - {formatClockLabel(report.sleepWindow.end)}</span>
          </div>
          <div className="sleep-score-hero-actual">
            <strong>{formatHm(report.actualSleepMinutes)}</strong>
            <span>실제 수면 시간</span>
          </div>
          <div className="sleep-score-factor-panel">
            <div className="sleep-score-factor-head">
              <strong>수면 점수 요인</strong>
            </div>
            <div className="sleep-factor-scroll">
              {report.scoreFactors.map((factor) => (
                <div className={`sleep-factor-card compact ${factor.tone}`} key={factor.key}>
                  <span>{factor.label}</span>
                  <strong>{factor.value}</strong>
                  <em className={`sleep-factor-tag ${factor.tone}`}>{factor.tag}</em>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card title="수면 단계">
          <SleepHypnogram
            segments={report.hypnogram.segments}
            timeLabels={timeLabels}
            movementLevels={report.hypnogram.movementLevels}
          />
          <div className="mt-6 flex flex-col gap-4">
            {report.stageBreakdown.map((stage) => (
              <SleepStageBreakdownRow stage={stage} key={stage.label} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-[var(--sub)]">
            <span className="inline-block h-2.5 w-4 rounded-sm bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]" />
            일반적인 범위
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sleep-vitals-grid">
          <Card title="코골이" action={`${report.snoringEpisodes.length}회 감지`}>
            <div className="sleep-vitals-card-body">
              <div className="sleep-snore-summary">
                <div className="big-number">
                  <small>어젯밤 총 코골이 시간</small>
                  {report.snoringEpisodes.reduce((sum, item) => sum + item.durationMinutes, 0)}<span>분</span>
                </div>
              </div>
              <div className="sleep-snore-list sleep-custom-scroll">
                {report.snoringEpisodes.map((item) => (
                  <div key={item.time} className="sleep-snore-item">
                    <span>{item.time}</span>
                    <span>{item.durationMinutes}분</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="심박수" action={`평균 ${Math.round(avgHeart)}bpm`}>
            <div className="sleep-vitals-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.stageLog.map((d) => ({ day: d.time, value: d.heartRate }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[45, 85]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                    itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                    formatter={(value) => [`${value} bpm`, '심박']}
                  />
                  <Line type="linear" dataKey="value" stroke="#e57373" strokeWidth={2} dot={{ fill: '#e57373', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="호흡수" action={`평균 ${avgBreath.toFixed(1)}회/분`}>
            <div className="sleep-vitals-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.stageLog.map((d) => ({ day: d.time, value: d.breathRate }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[8, 22]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                    itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                    formatter={(value) => [`${value}회/분`, '호흡']}
                  />
                  <Line type="linear" dataKey="value" stroke="#64b5f6" strokeWidth={2} dot={{ fill: '#64b5f6', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </>
    );
  })();

  return (
    <>
      <DateNavigatorBar
        mode="day"
        selectedDate={reportDate}
        latestDate={latestDate}
        labelFading={labelFading}
        onPrev={() => shiftDay(-1)}
        onNext={() => shiftDay(1)}
        nextDisabled={isSameDay(reportDate, latestDate)}
        onSelectDay={navigateToDate}
        className="mb-2"
      />

      <div
        ref={viewportRef}
        className={`sleep-report-viewport${isTransitioning ? ' is-locked' : ''}`}
        style={viewportMinH > 0 ? { minHeight: viewportMinH } : undefined}
      >
        {showSkeleton && (
          <div
            className={`sleep-report-skeleton${viewportMinH > 0 ? ' is-fill' : ''}`}
            aria-hidden="true"
          />
        )}

        {showContent && (
          <div
            className={[
              'sleep-report-content',
              contentPhaseClass,
              sessionLoading ? 'is-session-loading' : '',
            ].filter(Boolean).join(' ')}
            onAnimationEnd={handleTransitionEnd}
          >
            {reportError && !report && (
              <SleepReportEmpty message={reportError} />
            )}

            {reportBody}
          </div>
        )}
      </div>
    </>
  );
}
