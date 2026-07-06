import { sleepDailyInsights, sleepWeeklyInsights } from '../../data/sleepData';
import { postureDailyInsights, postureWeeklyInsights } from '../../data/postureData';

// Single canonical insight registry shared by SleepApi/PostureApi/WeeklyPlanApi mocks, mirroring
// the "PATCH /insights/{insightId} 하나로 통일" contract shared across sleep.md/posture.md/weekly-plan.md.
// Every mock must read/write through here so approving an insight in one domain's screen is
// reflected everywhere else that surfaces the same insight.

let nextInsightId = 1;

function toInsight(item, domain, period) {
  return {
    id: item.id ?? nextInsightId++,
    domain,
    period,
    label: item.label,
    title: item.title,
    text: item.text,
    approved: Boolean(item.approved),
  };
}

const insights = [
  ...sleepDailyInsights.map((item) => toInsight(item, 'sleep', 'daily')),
  ...sleepWeeklyInsights.map((item) => toInsight(item, 'sleep', 'weekly')),
  ...postureDailyInsights.map((item) => toInsight(item, 'posture', 'daily')),
  ...postureWeeklyInsights.map((item) => toInsight(item, 'posture', 'weekly')),
];

export function listInsights({ domain, period } = {}) {
  return insights.filter(
    (item) => (domain ? item.domain === domain : true) && (period ? item.period === period : true)
  );
}

export function findInsight(insightId) {
  return insights.find((item) => item.id === insightId) || null;
}

export function setInsightApproved(insightId, approved) {
  const insight = findInsight(insightId);
  if (!insight) return null;
  insight.approved = Boolean(approved);
  return insight;
}
