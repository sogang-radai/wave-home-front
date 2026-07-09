import { getToday } from '../../lib/demoClock';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Rolling 7-day window ending on `anchor` (inclusive): [anchor-6, anchor]. */
export function getRollingWeekEnd(anchor = getToday()) {
  const end = new Date(anchor);
  end.setHours(0, 0, 0, 0);
  return formatDateParam(end);
}

export function dayLabelForDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return DAY_LABELS[date.getDay()];
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values) {
  if (values.length === 0) return 0;
  const avg = average(values);
  return Math.sqrt(average(values.map((value) => (value - avg) ** 2)));
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

const SCORE_DIRECTION_THRESHOLD = 5;

function scoreDirection(from, to) {
  const delta = to - from;
  if (delta >= SCORE_DIRECTION_THRESHOLD) return 'up';
  if (delta <= -SCORE_DIRECTION_THRESHOLD) return 'down';
  return 'flat';
}

const SCORE_TREND_MESSAGES = {
  'up-up': '주 초반·후반 모두 회복세',
  'up-flat': '주 초반 상승 후 안정',
  'up-down': '초반 회복 후 후반 다소 하락',
  'flat-up': '주 후반으로 회복세',
  'flat-flat': '변동 없이 안정적',
  'flat-down': '후반으로 약간 하락',
  'down-up': '주 후반 눈에 띄는 회복',
  'down-flat': '초반 하락 후 안정',
  'down-down': '주 전반에 걸쳐 하락세',
};

/**
 * Consistency of nightly sleep duration (0–100). Higher = more regular bed/rest pattern.
 * Uses coefficient-of-variation on nights with recorded sleep.
 */
export function computeWakeRegularity(trend) {
  const hours = trend.filter((point) => point.hours > 0).map((point) => point.hours);
  if (hours.length < 2) return 0;

  const avg = average(hours);
  if (avg <= 0) return 0;

  const variation = stddev(hours) / avg;
  return Math.max(0, Math.min(100, Math.round(100 - variation * 120)));
}

export function buildWeeklyAnalysis(trend, sleepGoalHours = 7.5) {
  const first = trend[0];
  const last = trend[trend.length - 1];
  const mid = trend[3];
  const scoreDelta = last.score - first.score;

  const earlyTrend = scoreDirection(first.score, mid.score);
  const lateTrend = scoreDirection(mid.score, last.score);
  const scoreTrendLabel = SCORE_TREND_MESSAGES[`${earlyTrend}-${lateTrend}`] || '변동 없이 유지';

  const recordedNights = trend.filter((point) => point.hours > 0);
  const totalHours = trend.reduce((sum, point) => sum + point.hours, 0);
  const avgHours = recordedNights.length > 0
    ? recordedNights.reduce((sum, point) => sum + point.hours, 0) / recordedNights.length
    : 0;

  const debtHours = trend.reduce((sum, point) => sum + Math.max(0, sleepGoalHours - point.hours), 0);
  const shortDays = trend.filter((point) => point.hours > 0 && point.hours < sleepGoalHours).length;

  const regularityPercent = computeWakeRegularity(trend);

  return {
    averageScore: recordedNights.length > 0
      ? Math.round(average(recordedNights.map((point) => point.score)))
      : 0,
    analysis: [
      ['점수 변화', `${first.score}→${last.score}점`, `${formatSignedScore(scoreDelta)}점 · ${scoreTrendLabel}`],
      ['총합 수면 시간', `${totalHours.toFixed(1)}h`, `일 평균 ${avgHours.toFixed(1)}h`],
      ['수면 부채', formatHoursMinutes(debtHours), `목표(${sleepGoalHours}h) 대비 부족한 날 ${shortDays}일`],
      ['기상 규칙성', `${regularityPercent}%`, '수면 시간 편차 기준'],
    ],
    avgHoursForSummary: avgHours,
  };
}
