import { httpClient } from './httpClient';

export class GoalsApi {
  async getActiveGoal() {
    const items = await httpClient.get('/goals', { status: 'active' });
    return items[0] ?? null;
  }

  async createGoal({ title, category }) {
    return httpClient.post('/goals', { title, category });
  }

  async archiveGoal(goalId) {
    return httpClient.patch(`/goals/${goalId}`, { status: 'archived' });
  }

  async getCoaching(goalId) {
    return httpClient.get(`/goals/${goalId}/coaching`);
  }

  async applyRecommendation(goalId, recommendationId) {
    return httpClient.post(`/goals/${goalId}/recommendations/${recommendationId}/apply`, {});
  }

  async cancelRecommendation(goalId, recommendationId) {
    return httpClient.patch(`/goals/${goalId}/recommendations/${recommendationId}`, { approved: false });
  }
}
