import { sleepDailyInsights, sleepWeeklyInsights } from '../../data/sleepData';
import { postureDailyInsights, postureWeeklyInsights } from '../../data/postureData';

// Single canonical insight registry shared by SleepApi/PostureApi/WeeklyPlanApi mocks, mirroring
// the "PATCH /insights/{insightId} 하나로 통일" contract shared across sleep.md/posture.md/weekly-plan.md.
// Every mock must read/write through here so approving an insight in one domain's screen is
// reflected everywhere else that surfaces the same insight.

function toInsight(item, domain, period, index) {
  return {
    id: typeof item.id === 'string' ? item.id : `ins_${domain}_${period}_${item.id ?? index + 1}`,
    domain,
    period,
    label: item.label,
    title: item.title,
    text: item.text,
    approved: Boolean(item.approved),
  };
}

const insights = [
  ...sleepDailyInsights.map((item, index) => toInsight(item, 'sleep', 'daily', index)),
  ...sleepWeeklyInsights.map((item, index) => toInsight(item, 'sleep', 'weekly', index)),
  ...postureDailyInsights.map((item, index) => toInsight(item, 'posture', 'daily', index)),
  ...postureWeeklyInsights.map((item, index) => toInsight(item, 'posture', 'weekly', index)),
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
