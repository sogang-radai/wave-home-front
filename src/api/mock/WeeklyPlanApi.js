import { delay, cloneDeep, nextNumericId } from './utils';
import { initialTodos, CAT_STYLE, pickAICat } from '../../data/weeklyPlanData';
import { listInsights, findInsight as findInsightById } from './insightsStore';
import { InsightsApi } from './InsightsApi';
import { SleepApi } from './SleepApi';
import { PostureApi } from './PostureApi';

const insightsApi = new InsightsApi();

const sleepApiForReport = new SleepApi();
const postureApiForReport = new PostureApi();

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

function makeTaskId() {
  return nextNumericId();
}

const DAY_TO_KEY = {
  월: 'mon',
  화: 'tue',
  수: 'wed',
  목: 'thu',
  금: 'fri',
  토: 'sat',
  일: 'sun',
};

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const CATEGORY_TO_KEY = {
  자세: 'posture',
  수면: 'sleep',
  식습관: 'diet',
  멘탈: 'mental',
};

const CATEGORY_TO_LABEL = {
  posture: '자세',
  sleep: '수면',
  diet: '식습관',
  mental: '멘탈',
};

const VALID_CATEGORIES = ['posture', 'sleep', 'diet', 'mental'];

const DEFAULT_DURATION_MINUTES = 30;

function validationError(details) {
  throw apiError(400, 'VALIDATION_ERROR', '입력값을 확인해주세요.', { details });
}

function toTask(todo) {
  return {
    id: typeof todo.id === 'number' ? todo.id : Number(todo.id),
    title: todo.title,
    done: Boolean(todo.done),
    dayOfWeek: todo.dayOfWeek || DAY_TO_KEY[todo.day],
    category: todo.category || CATEGORY_TO_KEY[todo.cat],
    startMinute: todo.startMinute ?? todo.startMin,
    endMinute: todo.endMinute ?? todo.endMin,
    scheduleKind: todo.scheduleKind || 'weekly',
    eventDate: todo.eventDate ?? null,
    sourceInsightId: todo.sourceInsightId ?? null,
  };
}

function categorizeTitle(title) {
  return CATEGORY_TO_KEY[pickAICat(title)] || 'mental';
}

function defaultStartMinute(category) {
  const label = CATEGORY_TO_LABEL[category] || '멘탈';
  return CAT_STYLE[label]?.defaultMin ?? 13 * 60 + 30;
}

function ensureActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

function validateDayOfWeek(dayOfWeek, required = false) {
  if (dayOfWeek === undefined && !required) return [];
  if (!VALID_DAYS.includes(dayOfWeek)) {
    return [{
      field: 'dayOfWeek',
      code: 'INVALID_ENUM',
      message: 'dayOfWeek는 mon, tue, wed, thu, fri, sat, sun 중 하나여야 합니다.',
    }];
  }
  return [];
}

function validateCategory(category) {
  if (category === undefined) return [];
  if (!VALID_CATEGORIES.includes(category)) {
    return [{
      field: 'category',
      code: 'INVALID_ENUM',
      message: 'category는 posture, sleep, diet, mental 중 하나여야 합니다.',
    }];
  }
  return [];
}

function validateTimeRange(payload, requirePair = false) {
  const hasStart = payload.startMinute !== undefined;
  const hasEnd = payload.endMinute !== undefined;
  const details = [];

  if (requirePair && hasStart !== hasEnd) {
    details.push({
      field: hasStart ? 'endMinute' : 'startMinute',
      code: 'REQUIRED_WITH_TIME',
      message: '시간 지정 시 startMinute과 endMinute을 함께 보내야 합니다.',
    });
    return details;
  }

  if (!hasStart && !hasEnd) return details;

  if (hasStart !== hasEnd) {
    details.push({
      field: hasStart ? 'endMinute' : 'startMinute',
      code: 'REQUIRED_WITH_TIME',
      message: '시간 지정 시 startMinute과 endMinute을 함께 보내야 합니다.',
    });
    return details;
  }

  const { startMinute, endMinute } = payload;
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1440) {
    details.push({
      field: 'startMinute',
      code: 'OUT_OF_RANGE',
      message: 'startMinute은 0 이상 1440 이하의 정수여야 합니다.',
    });
  }
  if (!Number.isInteger(endMinute) || endMinute < 0 || endMinute > 1440) {
    details.push({
      field: 'endMinute',
      code: 'OUT_OF_RANGE',
      message: 'endMinute은 0 이상 1440 이하의 정수여야 합니다.',
    });
  }
  if (Number.isInteger(startMinute) && Number.isInteger(endMinute) && endMinute <= startMinute) {
    details.push({
      field: 'endMinute',
      code: 'INVALID_TIME_RANGE',
      message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    });
  }
  return details;
}

function taskFromPayload(payload) {
  const insight = payload.sourceInsightId ? findInsightById(payload.sourceInsightId) : null;
  if (payload.sourceInsightId && !insight) {
    throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
  }

  const title = insight?.title || payload.title?.trim();
  const details = [];
  if (!title) {
    details.push({
      field: 'title',
      code: 'REQUIRED',
      message: 'title은 필수입니다.',
    });
  }
  details.push(...validateDayOfWeek(payload.dayOfWeek, true));
  details.push(...validateTimeRange(payload, false));
  if (details.length > 0) validationError(details);

  const category = payload.category
    ? (VALID_CATEGORIES.includes(payload.category) ? payload.category : categorizeTitle(title))
    : insight
      ? (insight.domain === 'posture' ? 'posture' : insight.domain === 'sleep' ? 'sleep' : 'mental')
      : categorizeTitle(title);
  const startMinute = payload.startMinute ?? defaultStartMinute(category);
  const endMinute = payload.endMinute ?? startMinute + DEFAULT_DURATION_MINUTES;
  const scheduleKind = payload.scheduleKind === 'once' ? 'once' : 'weekly';
  const eventDate = scheduleKind === 'once' ? payload.eventDate ?? null : null;

  return {
    id: makeTaskId(),
    title,
    done: false,
    dayOfWeek: payload.dayOfWeek,
    category,
    startMinute,
    endMinute,
    scheduleKind,
    eventDate,
    sourceInsightId: insight?.id ?? null,
  };
}

function validatePatchPayload(payload) {
  if (!payload || Object.keys(payload).length === 0) {
    throw apiError(400, 'INVALID_BODY', '수정할 필드를 하나 이상 보내주세요.');
  }

  const details = [];
  if (payload.title !== undefined && !payload.title.trim()) {
    details.push({
      field: 'title',
      code: 'REQUIRED',
      message: 'title은 빈 문자열일 수 없습니다.',
    });
  }
  if (payload.done !== undefined && typeof payload.done !== 'boolean') {
    details.push({
      field: 'done',
      code: 'INVALID_TYPE',
      message: 'done은 boolean이어야 합니다.',
    });
  }
  details.push(...validateDayOfWeek(payload.dayOfWeek));
  details.push(...validateCategory(payload.category));
  details.push(...validateTimeRange(payload, true));
  if (details.length > 0) {
    const timeError = details.find((item) => item.code === 'INVALID_TIME_RANGE');
    if (details.length === 1 && timeError) {
      throw apiError(400, 'INVALID_TIME_RANGE', timeError.message, { field: timeError.field });
    }
    validationError(details);
  }
}

const ACTIVE_ACCOUNT_ID = 1;
let activeAccountId = ACTIVE_ACCOUNT_ID;
let tasks = initialTodos.map(toTask);

function getRecommendationGroups() {
  return [
    {
      key: 'daily_action',
      label: '오늘의 권장 액션',
      items: listInsights().filter((item) => item.label === '오늘의 권장 액션'),
    },
    {
      key: 'next_week_goal',
      label: '다음 주 목표',
      items: listInsights().filter((item) => item.label === '다음 주 목표'),
    },
  ];
}

export class WeeklyPlanApi {
  async getTasks() {
    await delay();
    ensureActiveAccount();
    return cloneDeep(tasks);
  }

  async createTask(payload) {
    await delay();
    ensureActiveAccount();
    const task = taskFromPayload(payload || {});
    tasks = [...tasks, task];
    return cloneDeep(task);
  }

  async updateTask(id, payload) {
    await delay();
    ensureActiveAccount();
    validatePatchPayload(payload);
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) throw apiError(404, 'NOT_FOUND', '일정을 찾을 수 없습니다.');

    const updated = {
      ...tasks[index],
      ...cloneDeep(payload),
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
    };
    tasks = tasks.map((task) => (task.id === id ? updated : task));
    return cloneDeep(updated);
  }

  async deleteTask(id) {
    await delay();
    ensureActiveAccount();
    const exists = tasks.some((task) => task.id === id);
    if (!exists) throw apiError(404, 'NOT_FOUND', '일정을 찾을 수 없습니다.');
    tasks = tasks.filter((task) => task.id !== id);
    return { id };
  }

  async getRecommendations() {
    await delay();
    ensureActiveAccount();
    return cloneDeep(getRecommendationGroups());
  }

  async getWeeklyAgentReport() {
    await delay();
    ensureActiveAccount();
    let sleepText = '';
    let postureText = '';
    try {
      const sleep = await sleepApiForReport.getWeeklyReport();
      sleepText = sleep.summary;
    } catch {
      sleepText = '수면 데이터를 확인할 수 없습니다.';
    }
    try {
      const posture = await postureApiForReport.getWeeklyReport();
      postureText = posture.summary;
    } catch {
      postureText = '자세 데이터를 확인할 수 없습니다.';
    }
    const done = tasks.filter((t) => t.done).length;
    const total = tasks.length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    return {
      headline: '주간 에이전트 리포트',
      body: `${sleepText} ${postureText} 이번 주 건강 계획은 ${done}/${total}개 완료(${rate}%) 상태입니다. AI가 추천한 루틴을 유지하면 다음 주 회복력이 더 좋아질 것으로 보입니다.`,
    };
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    ensureActiveAccount();
    return insightsApi.updateInsight(insightId, { approved });
  }

  async applyInsight(insightId) {
    await delay();
    ensureActiveAccount();
    return insightsApi.apply(insightId);
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
