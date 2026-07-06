import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Donut } from '../components/ui/Donut';
import { PostureScoreGauge } from './posture/PostureScoreGauge';
import { koreanWeekdayLabels } from '../data/weeklyPlanData';
import postureApi from '../api/postureApi';
import sleepApi from '../api/sleepApi';
import homeApi from '../api/homeApi';
import dashboardApi from '../api/dashboardApi';
import './main.css';

function formatOfflineDetail(devices) {
  const offline = devices.filter((device) => !device.connected);
  if (offline.length === 0) return '';
  if (offline.length === 1) return offline[0].name;
  return `${offline[0].name} 외 ${offline.length - 1}개`;
}

export function MainPage({
  onNavigate,
  todos,
  onToggleTodo,
  onGoToPowerAnalysis,
  onOpenChatWithDraft,
}) {
  const todayLabel = koreanWeekdayLabels[new Date().getDay()];
  const todayTodos = todos.filter((t) => t.day === todayLabel);
  const remaining = todayTodos.filter((todo) => !todo.done).length;

  const [postureSummary, setPostureSummary] = useState(null);
  const [sleepSummary, setSleepSummary] = useState(null);
  const [totalPower, setTotalPower] = useState(null);
  const [dailyMessage, setDailyMessage] = useState(null);
  const [currentState, setCurrentState] = useState(null);
  const [homeSummary, setHomeSummary] = useState(null);
  const [homeDevices, setHomeDevices] = useState([]);

  useEffect(() => {
    postureApi.getTodaySummary().then(setPostureSummary);
    sleepApi.getTodaySummary().then(setSleepSummary);
    homeApi.getPowerPlugs().then((plugs) => setTotalPower(plugs.find((device) => device.id === 'all') || plugs[0]));
    dashboardApi.getDailyMessage().then(setDailyMessage);
    dashboardApi.getCurrentState().then(setCurrentState);
    homeApi.getSummary().then(setHomeSummary);
    homeApi.getDevices().then(setHomeDevices);
  }, []);

  const powerChartData = useMemo(
    () => totalPower?.trend?.tenSec || totalPower?.trend?.hour || [],
    [totalPower]
  );

  const deviceConnectionValue = homeSummary
    ? homeSummary.onlineDeviceCount === homeSummary.totalDeviceCount
      ? '모두 연결됨'
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

  return (
    <div className="page-stack">
      <section className="hero card">
        {dailyMessage && (
          <div>
            <h2>{dailyMessage.headline}</h2>
            <p>{dailyMessage.body}</p>
          </div>
        )}
      </section>

      <section className="main-grid">
        <Card title="현재 상태">
          <div className="state-grid">
            {currentState && (
              <Metric
                label="실내 환경"
                value={currentState.indoorEnvironment.label}
                detail={currentState.indoorEnvironment.detail}
              />
            )}
            <Metric
              label="수면 점수"
              value={sleepSummary ? `${sleepSummary.score}점` : '—'}
              detail={
                sleepSummary
                  ? `${sleepSummary.achievedHours.toFixed(1)}h (${sleepSummary.bedTime}–${sleepSummary.wakeTime})`
                  : ''
              }
            />
            <Metric
              label="자세 점수"
              value={postureSummary ? `${postureSummary.score}점` : '—'}
              detail={postureSummary ? `거북목 감지 오늘 ${postureSummary.turtleNeckCount}회` : ''}
            />
            <Metric
              label="연결된 가전 상태"
              value={deviceConnectionValue}
              detail={deviceConnectionDetail}
              dot={deviceConnectionDot}
            />
          </div>
        </Card>

        <Card title="오늘 할일" action={`${remaining}개 남음`} onClick={() => onNavigate('weeklyPlan')}>
          <div className="todo-list">
            {todayTodos.length === 0 && (
              <p style={{ color: 'var(--sub)', fontSize: '0.8rem' }}>오늘 일정이 없습니다</p>
            )}
            {todayTodos.map((todo) => (
              <button
                type="button"
                className={`todo ${todo.done ? 'done' : ''}`}
                key={todo.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleTodo(todo.id);
                }}
              >
                <span className={todo.done ? 'checked' : ''}>{todo.done ? '✓' : ''}</span>
                <p>{todo.title}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="dashboard-health-grid">
        <div className="dashboard-power-column">
          <button
            type="button"
            className="dashboard-power-card"
            onClick={onGoToPowerAnalysis}
            disabled={!totalPower}
          >
            {totalPower && (
              <>
                <span>전력 관리</span>
                <strong>{totalPower.powerW.toFixed(1)}W</strong>
                <p>전체 콘센트 현재 사용량</p>
                <div className="dashboard-power-chart" aria-hidden="true">
                  <ResponsiveContainer width="100%" height={96}>
                    <LineChart data={powerChartData} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--wave)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="dashboard-power-meta">
                  <span>{totalPower.voltageV.toFixed(1)}V</span>
                  <span>{(totalPower.currentMa / 1000).toFixed(3)}A</span>
                  <span className="dashboard-power-cost">시간당 약 {totalPower.hourlyCostWon.toFixed(1)}원</span>
                </div>
              </>
            )}
          </button>

          <button
            type="button"
            className="feature-tile orange dashboard-power-insight"
            onClick={() => onOpenChatWithDraft?.('이번 주 전력 사용량을 분석하고 절약 방법을 알려줘')}
          >
            <strong>전력 사용량 분석</strong>
            <span>이번 주 저녁 시간대 전력 사용이 평소보다 12% 높아요. WaveAI에게 절약 팁을 물어보세요.</span>
          </button>
        </div>

        <div className="dashboard-sleep-column">
          <div className="dashboard-sleep-card">
            <Card title="어젯밤 수면" onClick={() => onNavigate('sleep')}>
              {sleepSummary && (
                <div className="flex items-center gap-8">
                  <Donut pct={sleepSummary.achievedHours / sleepSummary.goalHours} r={48} sw={11}>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{sleepSummary.achievedHours.toFixed(1)}</span>
                      <span className="text-xs" style={{ color: 'var(--sub)' }}>/ {sleepSummary.goalHours} h</span>
                    </div>
                  </Donut>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center gap-10">
                      <div>
                        <p className="mb-0.5 text-xs" style={{ color: 'var(--sub)' }}>달성</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{sleepSummary.achievedHours.toFixed(1)}</span>
                          <span className="text-sm" style={{ color: 'var(--sub)' }}>h</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--sub)' }}>오늘 달성량</p>
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
            </Card>
          </div>

          <button
            type="button"
            className="promo-card navy dashboard-sleep-card cursor-pointer border-0 text-left"
            onClick={() => onOpenChatWithDraft?.('가장 상쾌하게 깨어날 수 있는 취침 시간을 추천해줘')}
          >
            <strong>취침 가이드</strong>
            <p>가장 상쾌하게 깨어날 수 있는 취침 시간을 추천받아보세요.</p>
          </button>

          <button
            type="button"
            className="promo-card plum dashboard-sleep-card cursor-pointer border-0 text-left"
            onClick={() => onOpenChatWithDraft?.('우리 집 수면 환경을 더 쾌적하게 만들려면 어떻게 해야 할까?')}
          >
            <strong>수면 환경</strong>
            <p>최적의 수면 환경을 만드는 방법을 알아보세요.</p>
          </button>
        </div>

        <div className="dashboard-posture-column">
          <div className="dashboard-posture-card">
            <Card title="자세 점수" onClick={() => onNavigate('posture')}>
              {postureSummary && (
                <>
                  <PostureScoreGauge score={postureSummary.score} />
                  <p className="mt-3 text-center text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    거북목 감지 오늘 <span style={{ color: 'var(--excellent-text)' }}>{postureSummary.turtleNeckCount}회</span>
                  </p>
                  <p className="mt-0.5 text-center text-sm" style={{ color: 'var(--sub)' }}>
                    전주 평균 {postureSummary.turtleNeckLastWeekAverageCount}회 대비 개선
                  </p>
                  <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--wave-10)' }}>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{postureSummary.correctPosturePercent}%</p>
                        <p className="text-xs" style={{ color: 'var(--sub)' }}>바른 자세</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{postureSummary.alertAcceptRatePercent}%</p>
                        <p className="text-xs" style={{ color: 'var(--sub)' }}>알림 수락</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
