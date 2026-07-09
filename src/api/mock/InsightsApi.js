import { delay, cloneDeep } from './utils';
import { filterInsightsByPeriod } from '../v1/insightUtils';
import { findInsight, listInsights, setInsightApproved } from './insightsStore';

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

export class InsightsApi {
  async list({ surface, date, kind, approved, actionable } = {}) {
    await delay();
    let items = listInsights({ surface, kind });
    if (approved !== undefined) {
      items = items.filter((item) => item.approved === approved);
    }
    if (actionable !== undefined) {
      items = items.filter((item) => Boolean(item.actionable) === actionable);
    }
    if (date !== undefined) {
      // Mock seed has no per-date rows; date filter is a no-op until backend wiring.
    }
    return cloneDeep(items);
  }

  async get(insightId) {
    await delay();
    const insight = findInsight(insightId);
    if (!insight) throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
    return cloneDeep(insight);
  }

  async apply(insightId) {
    await delay();
    const insight = findInsight(insightId);
    if (!insight) throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
    if (insight.approved) {
      throw apiError(409, 'ALREADY_APPLIED', '이미 적용된 인사이트입니다.');
    }
    insight.approved = true;
    return {
      id: insight.id,
      approved: true,
      ruleJson: null,
      derivedScheduleTaskId: null,
    };
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    const insight = setInsightApproved(insightId, approved);
    if (!insight) throw apiError(404, 'NOT_FOUND', '인사이트를 찾을 수 없습니다.');
    return { id: insight.id, approved: insight.approved };
  }

  async listForSurface(surface, { period, date, kind, approved, actionable } = {}) {
    const items = await this.list({ surface, date, kind, approved, actionable });
    return filterInsightsByPeriod(items, period);
  }
}
