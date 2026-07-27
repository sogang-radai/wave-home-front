import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Donut } from '../components/ui/Donut';
import { formatClock12, formatNextFireLabel } from './alarm/alarmUtils';
import sleepApi from '../api/sleepApi';
import iotApi from '../api/iotApi';
import dashboardApi from '../api/dashboardApi';
import powerApi from '../api/powerApi';
import { findAction } from '../api/mock/deviceClassRegistry';
import { TIER2_WON_PER_KWH, formatAnchorDate } from './power/powerReportUtils';
import { useElementHeight } from '../hooks/useElementHeight';
import './main.css';

const GESTURES_PER_PAGE = 1;
const ALARMS_PER_PAGE = 2;
const POWER_SUMMARY_POLL_MS = 60000;
const POWER_TREND_POLL_MS = 5000;

const POWER_CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '8px 10px',
    boxShadow: '0 4px 14px var(--shadow)',
  },
  labelStyle: { color: 'var(--sub)', fontSize: 11, fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'var(--ink)', fontSize: 12, fontWeight: 700, padding: 0 },
  isAnimationActive: false,
};

const SLEEP_RADAR = {
  name: '침실 하방 레이더',
  role: '수면 모니터링',
  room: '침실',
};

function formatOfflineDetail(devices) {
  const offline = devices.filter((device) => !device.connected);
  if (offline.length === 0) return '';
  if (offline.length === 1) return offline[0].name;
  return `${offline[0].name} 외 ${offline.length - 1}개`;
}

function actionLabelFor(rule, devices) {
  const device = devices.find((d) => d.id === rule.actionDeviceId);
  const actionDef = device ? findAction(device.class, rule.actionName) : null;
  return `${rule.actionDeviceName} ${actionDef?.description || rule.actionName}`;
}

function sumWh(trend) {
  return (trend || []).reduce((sum, point) => sum + (point.wh ?? 0), 0);
}

function formatWh(wh) {
  return wh > 1000 ? `${(wh / 1000).toFixed(2)}kWh` : `${wh.toFixed(1)}Wh`;
}

// 콤보 트렌드 라벨("-1분", "지금" 등)에서 부호를 떼어 "1분"처럼 보여준다.
function formatAgoTooltipLabel(label) {
  if (label == null) return '';
  const str = String(label).trim();
  return str.startsWith('-') ? str.slice(1) : str;
}

const WEEKDAY_FULL_LABEL = {
  일: '일요일', 월: '월요일', 화: '화요일', 수: '수요일', 목: '목요일', 금: '금요일', 토: '토요일',
};

function formatWeekdayTooltipLabel(label) {
  return WEEKDAY_FULL_LABEL[label] || label;
}

function formatWon(costWon) {
  return `${costWon.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`;
}

function NavChevronIcon({ direction }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

export function MainPage({
  onNavigate,
  onGoToPowerAnalysis,
  onGoToGestures,
  onGoToAlarms,
}) {
  const [sleepSummary, setSleepSummary] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [totalPower, setTotalPower] = useState(null);
  const [powerTrend, setPowerTrend] = useState([]);
  const [weekTrend, setWeekTrend] = useState([]);
  const [dailyMessage, setDailyMessage] = useState(null);
  const [currentState, setCurrentState] = useState(null);
  const [homeSummary, setHomeSummary] = useState(null);
  const [homeDevices, setHomeDevices] = useState([]);
  const [upcomingAlarms, setUpcomingAlarms] = useState([]);
  const [activeGestureRules, setActiveGestureRules] = useState([]);
  const [gestureSetDefsById, setGestureSetDefsById] = useState({});
  const [gesturePage, setGesturePage] = useState(0);
  const [alarmPage, setAlarmPage] = useState(0);
  // 카드 세로 길이를 서로 맞추기 위해 기준이 되는 카드/컬럼의 실제 렌더 높이를 추적한다:
  // 홈 현황 ← 어젯밤 수면, 활성화된 제스처 목록 ← 예정된 알람, 전력 관리 ← 가전 제어 컬럼 전체.
  const [sleepCardRef, sleepCardHeight] = useElementHeight();
  const [alarmsCardRef, alarmsCardHeight] = useElementHeight();
  const [gestureColRef, gestureColHeight] = useElementHeight();

  useEffect(() => {
    // 데모/실서버 모두 /sleep/today/summary → sleep_session DB 조회.
    sleepApi.getTodaySummary().then(setSleepSummary).catch(() => setSleepSummary(null));
    sleepApi.getTodayPlan().then(setTodayPlan).catch(() => setTodayPlan(null));
    dashboardApi.getDailyMessage().then(setDailyMessage);
    dashboardApi.getCurrentState().then(setCurrentState);
    iotApi.getSummary().then(setHomeSummary);
    iotApi.getDevices().then(setHomeDevices);
    dashboardApi.getUpcomingAlarms().then(setUpcomingAlarms);
    dashboardApi.getActiveGestureRules().then(setActiveGestureRules);
  }, []);

  // 전력 카드 "실시간" 구간: DemoPowerMeter(/power/plugs) 실시간 값 + 최근 10분 그래프를 주기적으로 갱신.
  useEffect(() => {
    let cancelled = false;
    const loadLive = () => {
      Promise.all([
        powerApi.getPlugs(),
        powerApi.getComboTrend({ deviceId: 'all', range: 'min10', metric: 'w' }).catch(() => []),
      ]).then(([plugs, trend]) => {
        if (cancelled) return;
        const aggregate = (plugs || []).find((device) => device.id === 'all') || plugs?.[0] || null;
        setTotalPower(aggregate);
        setPowerTrend(Array.isArray(trend) ? trend : []);
      }).catch(() => {
        if (!cancelled) {
          setTotalPower(null);
          setPowerTrend([]);
        }
      });
    };
    loadLive();
    const timer = setInterval(loadLive, POWER_TREND_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 전력 카드 "이번 주" 구간: 최근 7일 기간 트렌드(그래프 + 사용량·예상 요금 합계).
  useEffect(() => {
    let cancelled = false;
    const loadWeek = () => {
      const { dateStr } = formatAnchorDate();
      powerApi.getPeriodTrend({ deviceId: 'all', period: 'week', refDate: dateStr })
        .then((trend) => { if (!cancelled) setWeekTrend(Array.isArray(trend) ? trend : []); })
        .catch(() => { if (!cancelled) setWeekTrend([]); });
    };
    loadWeek();
    const timer = setInterval(loadWeek, POWER_SUMMARY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 활성 제스처 룰이 가리키는 제스처 세트 정의(이름·썸네일)를 세트별로 한 번씩만 가져와 캐시한다.
  useEffect(() => {
    const missingSetIds = [...new Set(activeGestureRules.map((r) => r.gestureSetId))]
      .filter((setId) => setId && !gestureSetDefsById[setId]);
    if (missingSetIds.length === 0) return;
    Promise.all(missingSetIds.map((setId) => iotApi.getGestureSetDefinition(setId).catch(() => null))).then((defs) => {
      setGestureSetDefsById((prev) => {
        const next = { ...prev };
        defs.forEach((def, index) => {
          if (def) next[missingSetIds[index]] = def;
        });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGestureRules]);

  const weekWh = sumWh(weekTrend);
  const weekCostWon = (weekWh / 1000) * TIER2_WON_PER_KWH;

  const deviceConnectionValue = homeSummary
    ? homeSummary.onlineDeviceCount === homeSummary.totalDeviceCount
      ? '모두 연결'
      : `연결 끊김 (${homeSummary.onlineDeviceCount}/${homeSummary.totalDeviceCount})`
    : '—';

  const deviceConnectionDetail = homeSummary
    ? homeSummary.onlineDeviceCount === homeSummary.totalDeviceCount
      ? `${homeSummary.totalDeviceCount}개 가전 온라인`
      : formatOfflineDetail(homeDevices)
    : '';

  const deviceConnectionDot = homeSummary
    ? homeSummary.onlineDeviceCount === homeSummary.totalDeviceCount
      ? 'online'
      : undefined
    : undefined;

  const gesturePageCount = Math.max(1, Math.ceil(activeGestureRules.length / GESTURES_PER_PAGE));
  const currentGesturePage = Math.min(gesturePage, gesturePageCount - 1);
  const visibleGestureRules = activeGestureRules.slice(
    currentGesturePage * GESTURES_PER_PAGE,
    currentGesturePage * GESTURES_PER_PAGE + GESTURES_PER_PAGE
  );

  const alarmPageCount = Math.max(1, Math.ceil(upcomingAlarms.length / ALARMS_PER_PAGE));
  const currentAlarmPage = Math.min(alarmPage, alarmPageCount - 1);
  const visibleAlarms = upcomingAlarms.slice(
    currentAlarmPage * ALARMS_PER_PAGE,
    currentAlarmPage * ALARMS_PER_PAGE + ALARMS_PER_PAGE
  );

  return (
    <div className="page-stack dashboard-page">
      <section className="hero card">
        {dailyMessage && (
          <div>
            <h2>{dailyMessage.headline}</h2>
            <p>{dailyMessage.body}</p>
          </div>
        )}
      </section>

      {/* Overview grid: each column is its own independent stack, so a
          shorter column (e.g. 전력 관리) never gets stretched down to match
          a taller one (수면 관리) — the card below just sits directly
          against the card above it. */}
      <section className="dashboard-overview-grid">
        <div className="dashboard-overview-col">
          <p className="dashboard-col-title">수면 관리</p>
          <div className="dashboard-sleep-card" ref={sleepCardRef}>
            <Card title="어젯밤 수면" onClick={() => onNavigate('sleep')} data-coachmark="card-sleep">
              {sleepSummary && (
                <div className="flex items-center gap-6">
                  <Donut pct={sleepSummary.achievedHours / sleepSummary.goalHours} r={48} sw={11}>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{sleepSummary.achievedHours.toFixed(1)}</span>
                      <span className="text-xs" style={{ color: 'var(--sub)' }}>/ {sleepSummary.goalHours} h</span>
                    </div>
                  </Donut>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-10">
                      <div>
                        <p className="mb-0.5 text-xs" style={{ color: 'var(--sub)' }}>달성</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{sleepSummary.achievedHours.toFixed(1)}</span>
                          <span className="text-sm" style={{ color: 'var(--sub)' }}>h</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--sub)' }}>어젯밤 달성량</p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs" style={{ color: 'var(--sub)' }}>목표</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold" style={{ color: 'var(--sub)' }}>{sleepSummary.goalHours}</span>
                          <span className="text-sm" style={{ color: 'var(--sub)' }}>h</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--sub)' }}>일일 목표</p>
                      </div>
                    </div>
                    <div className="border-t pt-2" style={{ borderColor: 'var(--wave-10)' }}>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="w-16 shrink-0" style={{ color: 'var(--sub)' }}>입면 시간</span>
                        <span className="font-semibold" style={{ color: 'var(--ink)' }}>{sleepSummary.bedTime}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs">
                        <span className="w-16 shrink-0" style={{ color: 'var(--sub)' }}>기상 시간</span>
                        <span className="font-semibold" style={{ color: 'var(--ink)' }}>{sleepSummary.wakeTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {todayPlan && (
                <div className="mt-1 border-t pt-1" style={{ borderColor: 'var(--wave-10)' }}>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--ink-soft)' }}>오늘 밤 추천 수면 시간</p>
                  <span className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                    {todayPlan.bedtime} 취침 · {todayPlan.wakeTime} 기상
                  </span>
                  {todayPlan.rationale && (
                    <p className="mt-0.5 text-xs leading-5" style={{ color: 'var(--sub)' }}>{todayPlan.rationale}</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="dashboard-sleep-card" ref={alarmsCardRef}>
            <Card title="예정된 알람" action={`${upcomingAlarms.length}개`} onClick={onGoToAlarms} data-coachmark="card-alarms" className="dashboard-alarms-card">
              <div className="mt-2 flex flex-col gap-1">
                {upcomingAlarms.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--sub)' }}>오늘·내일 아침으로 예정된 알람이 없어요.</p>
                )}
                {visibleAlarms.map((alarm) => {
                  const { hour12, minute, meridiem } = formatClock12(alarm.timeMinute);
                  return (
                    <div
                      key={alarm.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-0.25"
                      style={{ background: 'var(--wave-05)' }}
                    >
                      <div className="flex min-w-0 items-baseline gap-2">
                        <p className="shrink-0 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{alarm.name}</p>
                        <p className="truncate text-xs" style={{ color: 'var(--sub)' }}>{formatNextFireLabel(new Date(alarm.nextFireAt))}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                          {String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                        </span>
                        <span className="ml-1 text-xs" style={{ color: 'var(--sub)' }}>{meridiem}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {alarmPageCount > 1 && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--wave-10)] disabled:opacity-30"
                    style={{ color: 'var(--ink)' }}
                    onClick={(event) => { event.stopPropagation(); setAlarmPage((p) => Math.max(0, p - 1)); }}
                    disabled={currentAlarmPage === 0}
                    aria-label="이전 알람"
                  >
                    <NavChevronIcon direction="prev" />
                  </button>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>
                    {currentAlarmPage + 1} / {alarmPageCount}
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--wave-10)] disabled:opacity-30"
                    style={{ color: 'var(--ink)' }}
                    onClick={(event) => { event.stopPropagation(); setAlarmPage((p) => Math.min(alarmPageCount - 1, p + 1)); }}
                    disabled={currentAlarmPage === alarmPageCount - 1}
                    aria-label="다음 알람"
                  >
                    <NavChevronIcon direction="next" />
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div
          className="dashboard-overview-col"
          style={gestureColHeight ? { minHeight: `${gestureColHeight}px` } : undefined}
        >
          <p className="dashboard-col-title">전력 관리</p>
          <button
            type="button"
            className="dashboard-power-card"
            data-coachmark="card-power"
            onClick={onGoToPowerAnalysis}
            disabled={!totalPower && weekTrend.length === 0}
          >
            <div className="dashboard-power-summary-row">
              <span className="dashboard-power-summary-label">실시간 사용량</span>
              {powerTrend.length > 0 && (
                <div className="dashboard-power-chart">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={powerTrend} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" hide />
                      <Tooltip
                        {...POWER_CHART_TOOLTIP_STYLE}
                        labelFormatter={formatAgoTooltipLabel}
                        formatter={(value) => [`${Number(value).toFixed(1)}W`, '전력']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--wave)"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {totalPower && (
                <div className="dashboard-power-summary-values">
                  <span>전력 <strong>{Number(totalPower.powerW ?? 0).toFixed(1)}W</strong></span>
                  <span>시간당 예상 요금 <strong>{Number(totalPower.hourlyCostWon ?? 0).toFixed(1)}원</strong></span>
                </div>
              )}
            </div>

            <div className="dashboard-power-summary-row">
              <span className="dashboard-power-summary-label">이번 주 사용량</span>
              {weekTrend.length > 0 && (
                <div className="dashboard-power-chart">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={weekTrend} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" hide />
                      <Tooltip
                        {...POWER_CHART_TOOLTIP_STYLE}
                        labelFormatter={formatWeekdayTooltipLabel}
                        formatter={(value) => [formatWh(Number(value)), '사용량']}
                      />
                      <Line
                        type="monotone"
                        dataKey="wh"
                        stroke="var(--wave)"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {weekTrend.length > 0 && (
                <div className="dashboard-power-summary-values">
                  <span>사용량 <strong>{formatWh(weekWh)}</strong></span>
                  <span>예상 요금 <strong>{formatWon(weekCostWon)}</strong></span>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="dashboard-overview-col" ref={gestureColRef}>
          <p className="dashboard-col-title">가전 제어</p>
          <div className="dashboard-posture-card">
            <Card
              title="실시간 홈 현황"
              data-coachmark="card-status"
              className="dashboard-status-card"
              style={sleepCardHeight ? { minHeight: `${sleepCardHeight}px` } : undefined}
            >
              <div className="state-grid state-grid-row">
                {currentState && (
                  <Metric
                    label="실내 환경"
                    value={currentState.indoorEnvironment.label}
                    detail={currentState.indoorEnvironment.detail}
                  />
                )}
                <Metric
                  label={SLEEP_RADAR.role}
                  value="실행중"
                  detail={'침실\u00A0하방\u00A0레이더로 모니터링\u00A0중'}
                  dot="online"
                />
                <Metric
                  label="연결된 가전 상태"
                  value={deviceConnectionValue}
                  detail={deviceConnectionDetail}
                  dot={deviceConnectionDot}
                />
              </div>
            </Card>
          </div>

          <div className="dashboard-posture-card">
            <Card
              title="활성화된 제스처 목록"
              action={`${activeGestureRules.length}개 사용 중`}
              onClick={onGoToGestures}
              data-coachmark="card-gestures"
              className="dashboard-gestures-card"
              style={alarmsCardHeight ? { minHeight: `${alarmsCardHeight}px` } : undefined}
            >
              <div className="mt-1 flex flex-col gap-1">
                {activeGestureRules.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--sub)' }}>아직 활성화된 제스처가 없어요.</p>
                )}
                {visibleGestureRules.map((rule) => {
                  const gestureClass = gestureSetDefsById[rule.gestureSetId]?.classes.find((c) => c.classId === rule.classId);
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-0.5"
                      style={{ background: 'var(--wave-05)' }}
                    >
                      {gestureClass?.thumbnail && (
                        <img
                          src={gestureClass.thumbnail}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          style={{ background: 'var(--wave-10)' }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                          {gestureClass?.name || '제스처'}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'var(--sub)' }}>
                          {actionLabelFor(rule, homeDevices)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {gesturePageCount > 1 && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--wave-10)] disabled:opacity-30"
                    style={{ color: 'var(--ink)' }}
                    onClick={(event) => { event.stopPropagation(); setGesturePage((p) => Math.max(0, p - 1)); }}
                    disabled={currentGesturePage === 0}
                    aria-label="이전 제스처"
                  >
                    <NavChevronIcon direction="prev" />
                  </button>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>
                    {currentGesturePage + 1} / {gesturePageCount}
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--wave-10)] disabled:opacity-30"
                    style={{ color: 'var(--ink)' }}
                    onClick={(event) => { event.stopPropagation(); setGesturePage((p) => Math.min(gesturePageCount - 1, p + 1)); }}
                    disabled={currentGesturePage === gesturePageCount - 1}
                    aria-label="다음 제스처"
                  >
                    <NavChevronIcon direction="next" />
                  </button>
                </div>
              )}
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
