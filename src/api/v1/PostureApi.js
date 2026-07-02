import { httpClient } from './httpClient';

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

  async getDailyInsights() {
    return httpClient.get('/posture/insights/daily');
  }

  async getWeeklyInsights() {
    return httpClient.get('/posture/insights/weekly');
  }

  async getAlertSettings() {
    return httpClient.get('/posture/settings/alerts');
  }

  async updateAlertSettings(payload) {
    return httpClient.put('/posture/settings/alerts', payload);
  }
}
