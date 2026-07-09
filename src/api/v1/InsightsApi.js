import { httpClient } from './httpClient';
import { filterInsightsByPeriod } from './insightUtils';

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

  /** Sleep/Posture thin wrappers — `GET /insights?surface=…` + period 필터 */
  async listForSurface(surface, { period, date, kind, approved, actionable } = {}) {
    const items = await this.list({ surface, date, kind, approved, actionable });
    return filterInsightsByPeriod(items, period);
  }
}
