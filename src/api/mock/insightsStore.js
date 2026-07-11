import { sleepDailyInsights, sleepWeeklyInsights } from '../../data/sleepData';
import { postureDailyInsights, postureWeeklyInsights } from '../../data/postureData';
import { powerInsights } from '../../data/homeData';
import { dashboardBannerInsights } from '../../data/dashboardInsightData';

// Canonical insight registry for mock APIs. Mirrors `insight` table (`surface`, `kind`, PATCH /insights/{id}).

let nextInsightId = 1;

function toInsight(item, surface, period) {
  // `power` has no daily/weekly period concept (unlike sleep/posture reports),
  // so it always gets 'tip' — the schema's catch-all kind for period-less cards.
  const kind = surface === 'power' ? 'tip' : period === 'weekly' ? 'goal' : 'action';
  const domain = surface === 'sleep_report' ? 'sleep' : surface === 'posture_report' ? 'posture' : surface === 'power' ? 'power' : null;
  return {
    id: item.id ?? nextInsightId++,
    surface,
    domain,
    period,
    kind,
    label: item.label,
    title: item.title,
    text: item.text,
    actionable: false,
    approved: Boolean(item.approved),
  };
}

function toDashboardInsight(item) {
  return {
    id: item.id ?? nextInsightId++,
    surface: item.surface,
    kind: item.kind,
    date: item.date,
    label: item.label,
    title: item.title,
    text: item.text,
    actionable: Boolean(item.actionable),
    approved: Boolean(item.approved),
  };
}

const insights = [
  ...dashboardBannerInsights.map(toDashboardInsight),
  ...sleepDailyInsights.map((item) => toInsight(item, 'sleep_report', 'daily')),
  ...sleepWeeklyInsights.map((item) => toInsight(item, 'sleep_report', 'weekly')),
  ...postureDailyInsights.map((item) => toInsight(item, 'posture_report', 'daily')),
  ...postureWeeklyInsights.map((item) => toInsight(item, 'posture_report', 'weekly')),
  ...powerInsights.map((item) => toInsight(item, 'power', undefined)),
];

export function listInsights({ surface, period, domain, kind } = {}) {
  return insights.filter((item) => {
    if (surface && item.surface !== surface) return false;
    if (domain && item.domain !== domain) return false;
    if (period && item.period !== period) return false;
    if (kind && item.kind !== kind) return false;
    return true;
  });
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
