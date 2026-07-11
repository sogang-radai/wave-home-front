import { nextNumericId } from './utils';

// Mock 목표 코칭 저장소. 실제 goal/goal_coaching_report/goal_recommendation 테이블 구조를 흉내낸다.
let goals = [];
let coachingByGoalId = {};

const CATEGORY_COACHING = {
  sleep: {
    pastSummary: '최근 30일간 취침 관련 습관을 약 68% 완료했어요. 최근 며칠은 흐름이 흔들리는 추세예요.',
    projection: '지금 흐름이 이어지면 다음 달 완료율은 조금 더 낮아질 수 있어요. 취침 준비 알림을 다시 켜보는 걸 추천해요.',
    completionRate: 0.68,
    trend: 'declining',
    recommendation: { title: '22:30 취침 준비 알림 추가', text: '취침 30분 전 알림을 추가해 습관을 다시 잡아보세요.', dayOfWeek: 'mon' },
    tip: { title: '스마트폰은 침실 밖에 두기', text: '자기 전 스마트폰 사용을 줄이면 취침 시간을 지키기 더 쉬워져요.' },
  },
  posture: {
    pastSummary: '최근 30일간 자세 관련 습관을 약 74% 완료했어요. 꾸준한 편이에요.',
    projection: '이 페이스를 유지하면 다음 달에도 비슷한 완료율을 기대할 수 있어요.',
    completionRate: 0.74,
    trend: 'steady',
    recommendation: { title: '오후 4시 목 스트레칭 알림', text: '오래 앉아있는 시간대에 스트레칭 알림을 추가해보세요.', dayOfWeek: 'wed' },
    tip: { title: '모니터 높이 맞추기', text: '눈높이에 모니터 상단을 맞추면 목·어깨 부담이 줄어요.' },
  },
  mental: {
    pastSummary: '최근 30일간 멘탈 관리 습관을 약 61% 완료했어요.',
    projection: '조금만 더 신경 쓰면 다음 달 완료율을 눈에 띄게 올릴 수 있어요.',
    completionRate: 0.61,
    trend: 'improving',
    recommendation: { title: '저녁 10분 명상 알림', text: '하루를 마무리하며 짧은 명상 시간을 가져보세요.', dayOfWeek: 'tue' },
    tip: { title: '취침 전 걱정 노트', text: '자기 전 걱정거리를 적어두면 마음이 한결 가벼워져요.' },
  },
  life: {
    pastSummary: '최근 30일간 생활 습관 목표를 약 70% 완료했어요.',
    projection: '지금 페이스라면 다음 달에도 무난히 목표를 이어갈 수 있어요.',
    completionRate: 0.70,
    trend: 'steady',
    recommendation: { title: '아침 물 한 잔 마시기 알림', text: '기상 직후 물 한 잔으로 하루를 시작해보세요.', dayOfWeek: 'thu' },
    tip: { title: '주간 회고 5분', text: '주말에 한 주를 짧게 돌아보면 다음 주 계획이 쉬워져요.' },
  },
  diet: {
    pastSummary: '최근 30일간 식습관 목표를 약 58% 완료했어요. 최근 개선되는 흐름이에요.',
    projection: '이 흐름을 이어가면 다음 달엔 완료율이 더 올라갈 수 있어요.',
    completionRate: 0.58,
    trend: 'improving',
    recommendation: { title: '점심 채소 위주 식단 알림', text: '점심시간 전 알림으로 식단 선택을 도와드려요.', dayOfWeek: 'fri' },
    tip: { title: '식사 전 물 한 잔', text: '식사 전 물을 마시면 과식을 줄이는 데 도움이 돼요.' },
  },
};

function buildCoaching(goal) {
  const preset = CATEGORY_COACHING[goal.category] || CATEGORY_COACHING.life;
  return {
    periodStart: new Date().toISOString().slice(0, 10),
    pastSummary: preset.pastSummary,
    projection: preset.projection,
    projectedMetrics: { completionRate: preset.completionRate, trend: preset.trend, streakDays: 2 },
    recommendations: [
      {
        id: nextNumericId(),
        goalId: goal.id,
        kind: 'action',
        title: preset.recommendation.title,
        text: preset.recommendation.text,
        actionable: true,
        actionType: 'schedule_task',
        approved: false,
        ruleJson: null,
        scheduleTaskJson: {
          title: preset.recommendation.title,
          dayOfWeek: preset.recommendation.dayOfWeek,
          scheduleKind: 'weekly',
          category: goal.category,
        },
      },
      {
        id: nextNumericId(),
        goalId: goal.id,
        kind: 'tip',
        title: preset.tip.title,
        text: preset.tip.text,
        actionable: false,
        actionType: null,
        approved: false,
        ruleJson: null,
        scheduleTaskJson: null,
      },
    ],
  };
}

export function getActiveGoal() {
  return goals.find((goal) => goal.status === 'active') || null;
}

export function createGoal({ title, category }) {
  goals.forEach((goal) => {
    if (goal.status === 'active') goal.status = 'archived';
  });
  const now = new Date().toISOString();
  const goal = {
    id: nextNumericId(),
    title,
    category,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  goals.push(goal);
  coachingByGoalId[goal.id] = buildCoaching(goal);
  return goal;
}

export function archiveGoal(goalId) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return null;
  goal.status = 'archived';
  goal.updatedAt = new Date().toISOString();
  return goal;
}

export function getCoaching(goalId) {
  return coachingByGoalId[goalId] || null;
}

function findRecommendation(goalId, recommendationId) {
  const coaching = coachingByGoalId[goalId];
  if (!coaching) return null;
  return coaching.recommendations.find((item) => item.id === recommendationId) || null;
}

export function applyRecommendation(goalId, recommendationId) {
  const item = findRecommendation(goalId, recommendationId);
  if (!item) return null;
  item.approved = true;
  if (item.actionType === 'schedule_task') {
    item.scheduleTaskJson = { ...item.scheduleTaskJson, id: nextNumericId() };
  }
  return {
    id: item.id,
    approved: true,
    ruleJson: item.ruleJson,
    derivedScheduleTaskId: item.scheduleTaskJson?.id ?? null,
    scheduleTaskJson: item.scheduleTaskJson,
  };
}

export function cancelRecommendation(goalId, recommendationId) {
  const item = findRecommendation(goalId, recommendationId);
  if (!item) return null;
  item.approved = false;
  return item;
}

export function resetGoalsStore() {
  goals = [];
  coachingByGoalId = {};
}
