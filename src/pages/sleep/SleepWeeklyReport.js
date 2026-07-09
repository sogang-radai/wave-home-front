import { CareReport } from '../../components/report/CareReport';
import { getNow } from '../../lib/demoClock';

function todayDateParam() {
  const now = getNow();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * `trend` is always returned in Mon→Sun order (both mock and real API), but
 * for display we want whichever day is "today" pinned to the rightmost bar
 * — rotating the days after today around to the front. If today isn't in
 * this week (e.g. viewing a past week), the original Mon→Sun order is kept.
 * Only the display copy is rotated; all stat math below uses the original
 * chronological `trend` order.
 */
function rotateTrendForDisplay(trend) {
  const todayParam = todayDateParam();
  const todayIdx = trend.findIndex((point) => point.date === todayParam);
  if (todayIdx === -1) return trend;
  return [...trend.slice(todayIdx + 1), ...trend.slice(0, todayIdx + 1)];
}

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values) {
  const avg = average(values);
  const variance = average(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

function formatSignedScore(delta) {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function formatHoursMinutes(totalHours) {
  const totalMinutes = Math.round(totalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}분`;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

/**
 * Computes the four weekly summary metrics directly from `trend`
 * (`{date, day, hours, score}` × 7) instead of relying on a backend
 * `analysis` field — this keeps mock and real API behavior identical since
 * both are only contractually guaranteed to provide `trend`.
 */
function buildWeeklyAnalysis(trend) {
  const first = trend[0];
  const last = trend[trend.length - 1];
  const scoreDelta = last.score - first.score;
  const scoreTrendLabel = scoreDelta > 0 ? '주 후반 회복세' : scoreDelta < 0 ? '주 후반 하락세' : '변동 없이 유지';

  const totalHours = trend.reduce((sum, d) => sum + d.hours, 0);
  const avgHours = totalHours / trend.length;

  const sleepGoalHours = 7.5;
  const debtHours = trend.reduce((sum, d) => sum + Math.max(0, sleepGoalHours - d.hours), 0);
  const shortDays = trend.filter((d) => d.hours < sleepGoalHours).length;

  // No real wake-clock-time data is guaranteed in `trend` (only hours/score),
  // so wake regularity is approximated from how consistent nightly sleep
  // duration was — lower variance implies a more regular sleep/wake rhythm.
  // This is explicitly labeled below so it isn't mistaken for an actual
  // wake-time-based measurement.
  const hoursStddev = stddev(trend.map((d) => d.hours));
  const regularityPercent = Math.max(0, Math.min(100, Math.round(100 - hoursStddev * 28)));

  return [
    ['점수 변화', `${first.score}→${last.score}점`, `${formatSignedScore(scoreDelta)}점 · ${scoreTrendLabel}`],
    ['총합 수면 시간', `${totalHours.toFixed(1)}h`, `일 평균 ${avgHours.toFixed(1)}h`],
    ['수면 부채', formatHoursMinutes(debtHours), `목표(${sleepGoalHours}h) 대비 부족한 날 ${shortDays}일`],
    ['기상 규칙성', `${regularityPercent}%`, '수면 시간 편차 기준 근사치'],
  ];
}

export function SleepWeeklyReport({ weeklyReport }) {
  if (!weeklyReport) return null;

  const displayTrend = rotateTrendForDisplay(weeklyReport.trend);
  const analysis = buildWeeklyAnalysis(weeklyReport.trend);

  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score={`${weeklyReport.score}점`}
      summary={weeklyReport.summary}
      trendData={displayTrend}
      averageScore={`${weeklyReport.averageScore}점`}
      analysis={analysis}
      showMetricDetail
    />
  );
}
