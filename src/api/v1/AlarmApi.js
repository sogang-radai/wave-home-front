import { httpClient } from './httpClient';

export class AlarmApi {
  async getAlarms() {
    return httpClient.get('/alarms');
  }

  async createAlarm(payload) {
    return httpClient.post('/alarms', payload);
  }

  async updateAlarm(id, payload) {
    return httpClient.patch(`/alarms/${id}`, payload);
  }

  async deleteAlarm(id) {
    return httpClient.delete(`/alarms/${id}`);
  }
}
