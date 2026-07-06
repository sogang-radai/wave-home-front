import { delay, cloneDeep } from './utils';
import {
  getGeneratedDailyReport,
  getGeneratedDailySessions,
  listGeneratedNightDates,
} from './sleepDataGenerator';
import { sleepWeeklyTrendData, sleepSettingSummaries } from '../../data/sleepData';
import { listInsights, setInsightApproved } from './insightsStore';

class MockApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

function apiError(status, code, message, extra) {
  return new MockApiError(status, code, message, extra);
}

function parseDateParts(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateValue, days) {
  const date = parseDateParts(dateValue);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function isMonday(dateValue) {
  const date = parseDateParts(dateValue);
  if (!date) return false;
  return date.getUTCDay() === 1;
}

function getMondayOfWeek(dateValue) {
  const date = parseDateParts(dateValue);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDate(date);
}

function validateDateParam(date) {
  if (date !== undefined && !parseDateParts(date)) {
    throw apiError(400, 'INVALID_DATE', 'date는 YYYY-MM-DD 형식이어야 합니다.');
  }
}

function validateWeekStartParam(weekStart) {
  if (weekStart !== undefined && (!parseDateParts(weekStart) || !isMonday(weekStart))) {
    throw apiError(400, 'INVALID_WEEK_START', 'weekStart는 해당 주의 월요일 날짜여야 합니다.');
  }
}

function toAnalysisItem(item) {
  if (Array.isArray(item)) {
    return { label: item[0], value: item[1], description: item[2] };
  }
  return item;
}

const ACTIVE_ACCOUNT_ID = 1;
let activeAccountId = ACTIVE_ACCOUNT_ID;

const todayPlanSeed = {
  bedtime: '23:30',
  wakeTime: '06:40',
  prepTime: '22:50',
  lightDimTime: '23:00',
  recommendedTemperatureCelsius: 24,
};

const todayPhoneUsageSeed = {
  usedMinutes: 18,
  goalMinutes: 10,
};

const automationSummarySeed = sleepSettingSummaries.map((item) => ({ title: item.title, text: item.text }));

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function buildWeeklyReport(weekStart) {
  const trend = [];
  let scoreSum = 0;
  let scoreCount = 0;

  for (let i = 0; i < 7; i++) {
    const nightDate = addDays(weekStart, i);
    const report = getGeneratedDailyReport(nightDate, 'main');
    const dateObj = parseDateParts(nightDate);
    const dayLabel = DAY_LABELS[dateObj.getUTCDay()];
    const template = sleepWeeklyTrendData[i] || sleepWeeklyTrendData[0];

    if (report) {
      const hours = Math.round((report.actualSleepMinutes / 60) * 10) / 10;
      trend.push({ date: nightDate, day: dayLabel, hours, score: report.score });
      scoreSum += report.score;
      scoreCount += 1;
    } else {
      trend.push({ date: nightDate, day: dayLabel, hours: template.hours, score: template.score });
    }
  }

  const averageScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 81;

  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    score: averageScore,
    summary: '평균 수면 시간은 줄었지만, 기상 규칙성과 깊은 수면 비율은 후반으로 갈수록 개선되었습니다.',
    averageScore,
    trend,
    analysis: [
      ['점수 변화', '74→89점', '주 후반 회복세'],
      ['총합 수면 시간', '46.8h', '전주 대비 18% 감소'],
      ['수면 부채', '2h 10m', '평일 누적 부족'],
      ['온도 민감 구간', '3회', '26℃ 이상에서 뒤척임 증가'],
      ['기상 규칙성', '82%', '전주 대비 +6%'],
    ].map(toAnalysisItem),
  };
}

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

function getInsightCollection(period) {
  if (period !== 'daily' && period !== 'weekly') {
    throw apiError(400, 'INVALID_PERIOD', 'period는 daily 또는 weekly여야 합니다.');
  }
  return listInsights({ domain: 'sleep', period });
}

function defaultWeekStart() {
  const nights = listGeneratedNightDates();
  if (nights.length === 0) return getMondayOfWeek(formatDate(new Date()));
  return getMondayOfWeek(nights[nights.length - 1]);
}

export class SleepApi {
  async getTodaySummary() {
    await delay();
    requireActiveAccount();
    const nights = listGeneratedNightDates();
    const lastNight = nights[nights.length - 1];
    const report = getGeneratedDailyReport(lastNight, 'main');
    if (!report) {
      return {
        date: formatDate(new Date()),
        score: 0,
        achievedHours: 0,
        goalHours: 7.5,
        bedTime: '--:--',
        wakeTime: '--:--',
      };
    }

    const start = new Date(report.sleepWindow.start);
    const end = new Date(report.sleepWindow.end);
    const padTime = (d) => `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;

    return {
      date: formatDate(end),
      score: report.score,
      achievedHours: Math.round((report.actualSleepMinutes / 60) * 10) / 10,
      goalHours: 7.5,
      bedTime: padTime(start),
      wakeTime: padTime(end),
    };
  }

  async getTodayPlan() {
    await delay();
    requireActiveAccount();
    return cloneDeep(todayPlanSeed);
  }

  async getTodayPhoneUsage() {
    await delay();
    requireActiveAccount();
    return cloneDeep(todayPhoneUsageSeed);
  }

  async getTodayAutomationSummary() {
    await delay();
    requireActiveAccount();
    return cloneDeep(automationSummarySeed);
  }

  async getDailySessions(date) {
    await delay();
    requireActiveAccount();
    validateDateParam(date);
    const sessions = getGeneratedDailySessions(date);
    if (!sessions) {
      throw apiError(404, 'NOT_FOUND', '해당 날짜의 수면 기록이 없습니다.');
    }
    return cloneDeep(sessions);
  }

  async getDailyReport(date, { sessionId } = {}) {
    await delay();
    requireActiveAccount();
    validateDateParam(date);
    const report = getGeneratedDailyReport(date, sessionId || 'main');
    if (!report) {
      throw apiError(404, 'NOT_FOUND', '해당 날짜의 수면 기록이 없습니다.');
    }
    return cloneDeep(report);
  }

  async getWeeklyReport(weekStart) {
    await delay();
    requireActiveAccount();
    validateWeekStartParam(weekStart);
    const targetWeekStart = weekStart || defaultWeekStart();
    return cloneDeep(buildWeeklyReport(targetWeekStart));
  }

  async getInsights({ period } = {}) {
    await delay();
    requireActiveAccount();
    return cloneDeep(getInsightCollection(period));
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    requireActiveAccount();
    const insight = setInsightApproved(insightId, approved);
    if (!insight) throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
    return { id: insight.id, approved: insight.approved };
  }

  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
