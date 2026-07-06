import { httpClient } from './httpClient';

export class WeeklyPlanApi {
  async getTasks() {
    return httpClient.get('/weekly-plan/tasks');
  }

  async createTask(payload) {
    return httpClient.post('/weekly-plan/tasks', payload);
  }

  async updateTask(id, payload) {
    return httpClient.patch(`/weekly-plan/tasks/${id}`, payload);
  }

  async deleteTask(id) {
    return httpClient.delete(`/weekly-plan/tasks/${id}`);
  }

  async getRecommendations() {
    return httpClient.get('/weekly-plan/recommendations');
  }

  async getWeeklyAgentReport() {
    return httpClient.get('/weekly-plan/agent-report');
  }

  async updateInsight(insightId, { approved }) {
    return httpClient.patch(`/insights/${insightId}`, { approved });
  }
}
