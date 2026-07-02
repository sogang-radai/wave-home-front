import { httpClient } from './httpClient';

export class DashboardApi {
  async getDailyMessage() {
    return httpClient.get('/dashboard/daily-message');
  }

  async getCurrentState() {
    return httpClient.get('/dashboard/current-state');
  }
}
