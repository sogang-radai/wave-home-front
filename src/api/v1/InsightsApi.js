import { httpClient } from './httpClient';
import {
  filterInsightsByPeriod,
  INSIGHT_CARD_LIMIT,
  pickLatestDateInsights,
} from './insightUtils';

export class InsightsApi {
  async list({ surface, date, kind, approved, actionable } = {}) {
    return httpClient.get('/insights', { surface, date, kind, approved, actionable });
  }

  async get(insightId) {
    return httpClient.get(`/insights/${insightId}`);
  }

  async apply(insightId) {
    return httpClient.post(`/insights/${insightId}/apply`, {});
  }

  async updateInsight(insightId, { approved }) {
    return httpClient.patch(`/insights/${insightId}`, { approved });
  }

  /**
   * Domain thin wrapper — `GET /insights?surface=…` + period 필터.
   * date 미지정 시 최신 발행일만, 항상 최대 INSIGHT_CARD_LIMIT 장.
   */
  async listForSurface(surface, { period, date, kind, approved, actionable, limit = INSIGHT_CARD_LIMIT } = {}) {
    const items = await this.list({ surface, date, kind, approved, actionable });
    const byPeriod = filterInsightsByPeriod(items, period);
    if (date) return byPeriod.slice(0, limit);
    return pickLatestDateInsights(byPeriod, { limit });
  }
}
