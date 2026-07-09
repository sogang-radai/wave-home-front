import { httpClient } from './httpClient';
import { InsightsApi } from './InsightsApi';

const insightsApi = new InsightsApi();

export class SleepApi {
  async getTodaySummary() {
    return httpClient.get('/sleep/today/summary');
  }

  async getTodayPlan() {
    return httpClient.get('/sleep/today/plan');
  }

  async getTodayPhoneUsage() {
    return httpClient.get('/sleep/today/phone-usage');
  }

  async getTodayAutomationSummary() {
    return httpClient.get('/sleep/today/automation-summary');
  }

  async getDailySessions(date) {
    return httpClient.get('/sleep/reports/daily/sessions', { date });
  }

  async getDailyReport(date, { sessionId } = {}) {
    return httpClient.get('/sleep/reports/daily', { date, sessionId });
  }

  async getWeeklyReport(weekStart) {
    return httpClient.get('/sleep/reports/weekly', { weekStart });
  }

  async getInsights({ period, date } = {}) {
    return insightsApi.listForSurface('sleep_report', { period, date });
  }

  async updateInsight(insightId, { approved }) {
    return insightsApi.updateInsight(insightId, { approved });
  }

  async applyInsight(insightId) {
    return insightsApi.apply(insightId);
  }
}
