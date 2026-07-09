import { httpClient } from './httpClient';
import { InsightsApi } from './InsightsApi';

const insightsApi = new InsightsApi();

export class PostureApi {
  async getTodaySummary() {
    return httpClient.get('/posture/today/summary');
  }

  async getToday() {
    return httpClient.get('/posture/today');
  }

  async getDailyReport(date) {
    return httpClient.get('/posture/reports/daily', { date });
  }

  async getWeeklyReport(weekStart) {
    return httpClient.get('/posture/reports/weekly', { weekStart });
  }

  async getDailyInsights({ date } = {}) {
    return insightsApi.listForSurface('posture_report', { period: 'daily', date });
  }

  async getWeeklyInsights({ date } = {}) {
    return insightsApi.listForSurface('posture_report', { period: 'weekly', date });
  }

  async getAlertSettings() {
    return httpClient.get('/posture/settings/alerts');
  }

  async updateAlertSettings(payload) {
    return httpClient.put('/posture/settings/alerts', payload);
  }

  async updateInsight(insightId, { approved }) {
    return insightsApi.updateInsight(insightId, { approved });
  }

  async applyInsight(insightId) {
    return insightsApi.apply(insightId);
  }
}
