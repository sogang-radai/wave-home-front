import { delay, cloneDeep } from './utils';
import { postureBars, postureLog, postureDailyInsights, postureWeeklyInsights, postureWeeklyTrendData } from '../../data/postureData';

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

function toHourlyPosture(item) {
  return {
    hour: item.hour ?? item.label,
    score: item.score ?? item.value,
    turtleNeckCount: item.turtleNeckCount ?? item.turtleNeck ?? 0,
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
    id: typeof item.id === 'string' ? item.id : `ins_posture_${period}_${item.id ?? index + 1}`,
    domain: 'posture',
    period,
    label: item.label,
    title: item.title,
    text: item.text,
    approved: Boolean(item.approved),
  };
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateParts(value) {
  if (!isDate(value)) return null;
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

function validateAlertSettings(payload) {
  const keys = ['turtleNeck', 'waistTilt', 'longSitting'];
  const valid = keys.every((key) => typeof payload?.[key] === 'boolean');
  if (!valid) {
    throw apiError(400, 'INVALID_BODY', '설정 값은 boolean이어야 합니다.');
  }
}

const ACTIVE_ACCOUNT_ID = 'acc_01J2ZQ8M6R9P4T7X3A5B2C1D0E';
let activeAccountId = ACTIVE_ACCOUNT_ID;

const todaySummarySeed = {
  score: 78,
  turtleNeckCount: 4,
  turtleNeckLastWeekAverageCount: 7.3,
  correctPosturePercent: 71,
  alertAcceptRatePercent: 62,
};

const todaySeed = {
  date: '2026-07-02',
  current: {
    postureText: '정자세 유지 중',
    feedbackText: '지금 자세가 좋아요! 이대로 30분만 더 유지해보세요.',
  },
  stats: {
    score: 78,
    correctPosturePercent: 71,
    correctPostureGoalPercent: 80,
    alertAcceptRatePercent: 62,
    totalSittingMinutes: 320,
    maxContinuousSittingMinutes: 108,
    recommendedMaxContinuousSittingMinutes: 90,
  },
  hourly: postureBars.map(toHourlyPosture),
};

const dailyReports = {
  '2026-07-01': {
    date: '2026-07-01',
    score: 82,
    summary: '오래 앉아 있을수록 허리보다 목 자세가 먼저 무너지는 패턴이 반복되었습니다.',
    log: postureLog,
    analysis: [
      ['자세 점수', '82점', '어제보다 6점 상승'],
      ['책상 앞 체류 시간', '5h 20m', '오후 업무 구간 집중'],
      ['바른 자세 유지', '62%', '목표 70%까지 8%p 부족'],
      ['거북목 위험 시간', '48분', '3단계 알림 전 1회 회복'],
      ['허리 굽음 시간', '1h 10m', '골반 세우기 피드백 필요'],
      ['가장 무너진 시간대', '15:00~17:00', '목 전방 자세 반복'],
    ].map(toAnalysisItem),
  },
};

const weeklyReports = {
  '2026-06-29': {
    weekStart: '2026-06-29',
    weekEnd: '2026-07-05',
    score: 81,
    summary: '자세 점수는 상승했지만 허리 굽음 빈도는 늘어, 목 리셋과 허리 리셋을 분리해서 관리해야 합니다.',
    averageScore: 81,
    trend: postureWeeklyTrendData.map((item, index) => ({
      date: addDays('2026-06-29', index),
      day: item.day,
      score: item.score,
    })),
    analysis: [
      ['점수 변화', '74→81점', '주간 평균 기준 개선'],
      ['거북목 지속 시간', '18% 감소', '목 리셋 알림 반응 개선'],
      ['허리 굽음 빈도', '9% 증가', '오후 착석 후반부 집중'],
      ['휴식 루틴 수행률', '64%', '목표 80%까지 16%p 부족'],
      ['장시간 착석 알림', '7회', '50분 이상 같은 자세 유지'],
    ].map(toAnalysisItem),
  },
};

let alertSettings = {
  turtleNeck: true,
  waistTilt: true,
  longSitting: false,
};

let dailyInsights = postureDailyInsights.map((item, index) => toInsight(item, 'daily', index));
let weeklyInsights = postureWeeklyInsights.map((item, index) => toInsight(item, 'weekly', index));

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

export class PostureApi {
  async getTodaySummary() {
    await delay();
    requireActiveAccount();
    return cloneDeep(todaySummarySeed);
  }

  async getToday() {
    await delay();
    requireActiveAccount();
    return cloneDeep(todaySeed);
  }

  async getDailyReport(date) {
    await delay();
    requireActiveAccount();
    validateDateParam(date);
    const targetDate = date || '2026-07-01';
    const report = dailyReports[targetDate];
    if (!report) {
      throw apiError(404, 'NOT_FOUND', '해당 날짜의 자세 기록이 없습니다.');
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
      throw apiError(404, 'NOT_FOUND', '해당 주의 자세 기록이 없습니다.');
    }
    return cloneDeep(report);
  }

  async getDailyInsights() {
    await delay();
    requireActiveAccount();
    return cloneDeep(dailyInsights);
  }

  async getWeeklyInsights() {
    await delay();
    requireActiveAccount();
    return cloneDeep(weeklyInsights);
  }

  async getAlertSettings() {
    await delay();
    requireActiveAccount();
    return cloneDeep(alertSettings);
  }

  async updateAlertSettings(payload) {
    await delay();
    requireActiveAccount();
    validateAlertSettings(payload);
    alertSettings = cloneDeep(payload);
    return cloneDeep(alertSettings);
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
