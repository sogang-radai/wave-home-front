import { delay, cloneDeep } from './utils';
import {
  sleepScoreFactors,
  sleepStageBreakdown,
  sleepHypnogramSegments,
  sleepStageLog,
  snoringEpisodes,
  sleepDailyAnalysis,
  sleepWeeklyTrendData,
  sleepDailyInsights,
  sleepWeeklyInsights,
  sleepSettingSummaries,
  movementTicks,
} from '../../data/sleepData';

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

function stageFromLabel(label) {
  if (label === '기상' || label === '각성') return 'awake';
  if (label === 'REM') return 'rem';
  if (label === '깊은 수면') return 'deep';
  return 'light';
}

function durationMinutesFromText(text) {
  const hours = text.match(/(\d+)시간/)?.[1];
  const minutes = text.match(/(\d+)분/)?.[1];
  return (Number(hours || 0) * 60) + Number(minutes || 0);
}

function toScoreFactor(item, index) {
  const keys = ['duration', 'deepSleep', 'remSleep', 'awake', 'sleepLatency'];
  return {
    key: keys[index] || item.label,
    label: item.label,
    value: item.value,
    tag: item.tag,
    tone: item.tone,
  };
}

function toStageBreakdown(item) {
  return {
    stage: item.tone,
    label: item.label,
    percent: item.pct,
    durationMinutes: durationMinutesFromText(item.time),
    durationText: item.time,
    tone: item.tone,
    typicalPercentRange: item.typical,
  };
}

function toHypnogramSegment(item) {
  return {
    stage: item.stage,
    durationMinutes: item.durationMinutes ?? item.minutes,
  };
}

function toStageLogPoint(item) {
  const stage = stageFromLabel(item.stage);
  return {
    time: item.time,
    stage,
    stageLabel: item.stage,
    breathRate: item.breath,
    heartRate: item.heart,
    level: item.level,
  };
}

function toSnoringEpisode(item) {
  return {
    time: item.time,
    durationMinutes: item.durationMinutes ?? item.duration,
  };
}

function toAnalysisItem(item) {
  if (Array.isArray(item)) {
    return {
      label: item[0],
      value: item[1],
      description: item[2],
    };
  }
  return item;
}

function toInsight(item, period, index) {
  return {
    id: typeof item.id === 'string' ? item.id : `ins_sleep_${period}_${item.id ?? index + 1}`,
    domain: 'sleep',
    period,
    label: item.label,
    title: item.title,
    text: item.text,
    approved: Boolean(item.approved),
  };
}

const ACTIVE_ACCOUNT_ID = 'acc_01J2ZQ8M6R9P4T7X3A5B2C1D0E';
let activeAccountId = ACTIVE_ACCOUNT_ID;

const todaySummarySeed = {
  date: '2026-07-02',
  score: 82,
  achievedHours: 7.0,
  goalHours: 7.5,
  bedTime: '23:42',
  wakeTime: '06:42',
};

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

const dailyReports = {
  '2026-07-01': {
    date: '2026-07-01',
    score: 82,
    sleepWindow: {
      start: '2026-07-01T23:11:00+09:00',
      end: '2026-07-02T06:36:00+09:00',
    },
    timeInBedMinutes: 445,
    actualSleepMinutes: 336,
    scoreFactors: sleepScoreFactors.map(toScoreFactor),
    stageBreakdown: sleepStageBreakdown.map(toStageBreakdown),
    hypnogram: {
      start: '2026-07-01T23:11:00+09:00',
      end: '2026-07-02T06:36:00+09:00',
      segments: sleepHypnogramSegments.map(toHypnogramSegment),
      movementLevels: movementTicks,
    },
    stageLog: sleepStageLog.map(toStageLogPoint),
    snoringEpisodes: snoringEpisodes.map(toSnoringEpisode),
    analysis: sleepDailyAnalysis.map(toAnalysisItem),
  },
};

const weeklyReports = {
  '2026-06-29': {
    weekStart: '2026-06-29',
    weekEnd: '2026-07-05',
    score: 81,
    summary: '평균 수면 시간은 줄었지만, 기상 규칙성과 깊은 수면 비율은 후반으로 갈수록 개선되었습니다.',
    averageScore: 81,
    trend: sleepWeeklyTrendData.map((item, index) => ({
      date: addDays('2026-06-29', index),
      day: item.day,
      hours: item.hours,
      score: item.score,
    })),
    analysis: [
      ['점수 변화', '74→89점', '주 후반 회복세'],
      ['총합 수면 시간', '46.8h', '전주 대비 18% 감소'],
      ['수면 부채', '2h 10m', '평일 누적 부족'],
      ['온도 민감 구간', '3회', '26℃ 이상에서 뒤척임 증가'],
      ['기상 규칙성', '82%', '전주 대비 +6%'],
    ].map(toAnalysisItem),
  },
};

let dailyInsights = sleepDailyInsights.map((item, index) => toInsight(item, 'daily', index));
let weeklyInsights = sleepWeeklyInsights.map((item, index) => toInsight(item, 'weekly', index));

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

function getInsightCollection(period) {
  if (period === 'daily') return dailyInsights;
  if (period === 'weekly') return weeklyInsights;
  throw apiError(400, 'INVALID_PERIOD', 'period는 daily 또는 weekly여야 합니다.');
}

export class SleepApi {
  async getTodaySummary() {
    await delay();
    requireActiveAccount();
    return cloneDeep(todaySummarySeed);
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

  async getDailyReport(date) {
    await delay();
    requireActiveAccount();
    validateDateParam(date);
    const targetDate = date || '2026-07-01';
    const report = dailyReports[targetDate];
    if (!report) {
      throw apiError(404, 'NOT_FOUND', '해당 날짜의 수면 기록이 없습니다.');
    }
    return cloneDeep(report);
  }

  async getWeeklyReport(weekStart) {
    await delay();
    requireActiveAccount();
    validateWeekStartParam(weekStart);
    const targetWeekStart = weekStart || '2026-06-29';
    const report = weeklyReports[targetWeekStart];
    if (!report) {
      throw apiError(404, 'NOT_FOUND', '해당 주의 수면 기록이 없습니다.');
    }
    return cloneDeep(report);
  }

  async getInsights({ period } = {}) {
    await delay();
    requireActiveAccount();
    return cloneDeep(getInsightCollection(period));
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    requireActiveAccount();
    const collections = [dailyInsights, weeklyInsights];
    for (const collection of collections) {
      const insight = collection.find((item) => item.id === insightId);
      if (insight) {
        insight.approved = Boolean(approved);
        return { id: insight.id, approved: insight.approved };
      }
    }
    throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
