import { httpClient } from './httpClient';
import { InsightsApi } from './InsightsApi';

const insightsApi = new InsightsApi();

export class WeeklyPlanApi {
  async getTasks(query) {
    return httpClient.get('/schedule-tasks', query);
  }

  async createTask(payload) {
    return httpClient.post('/schedule-tasks', payload);
  }

  async updateTask(id, payload) {
    return httpClient.patch(`/schedule-tasks/${id}`, payload);
  }

  async deleteTask(id) {
    return httpClient.delete(`/schedule-tasks/${id}`);
  }

  async getRecommendations() {
    return httpClient.get('/weekly-plan/recommendations');
  }

  async getWeeklyAgentReport(query) {
    return httpClient.get('/weekly-plan/report', query);
  }

  async updateInsight(insightId, { approved }) {
    return insightsApi.updateInsight(insightId, { approved });
  }

  async applyInsight(insightId) {
    return insightsApi.apply(insightId);
  }
}
