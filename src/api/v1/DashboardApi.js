import { httpClient } from './httpClient';

export class DashboardApi {
  async getDailyMessage() {
    return httpClient.get('/dashboard/daily-message');
  }

  async getCurrentState() {
    return httpClient.get('/dashboard/current-state');
  }

  async getUpcomingAlarms() {
    return httpClient.get('/dashboard/alarms/upcoming');
  }

  async getActiveGestureRules() {
    return httpClient.get('/dashboard/gestures/active');
  }
}
