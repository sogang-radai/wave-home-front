import { httpClient } from './httpClient';

// SleepApi·WeeklyPlanApi 가 공유하는 인사이트 승인 엔드포인트.
export class InsightsApi {
  async updateInsight(insightId, { approved }) {
    return httpClient.patch(`/insights/${insightId}`, { approved });
  }
}
