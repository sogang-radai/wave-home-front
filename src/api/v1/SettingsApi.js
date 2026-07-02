import { httpClient } from './httpClient';

export class SettingsApi {
  async getSession() {
    return httpClient.get('/session');
  }

  async switchActiveAccount(accountId) {
    return httpClient.patch('/session/active-account', { accountId });
  }

  async getAccounts() {
    return httpClient.get('/accounts');
  }

  async createAccount({ name }) {
    return httpClient.post('/accounts', { name });
  }

  async updateAccount(accountId, { name }) {
    return httpClient.patch(`/accounts/${accountId}`, { name });
  }

  async deleteAccount(accountId) {
    return httpClient.delete(`/accounts/${accountId}`);
  }

  async getRooms() {
    return httpClient.get('/rooms');
  }

  async createRoom({ name, description = '' }) {
    return httpClient.post('/rooms', { name, description });
  }

  async updateRoom(roomId, { name, description }) {
    return httpClient.patch(`/rooms/${roomId}`, { name, description });
  }

  async deleteRoom(roomId) {
    return httpClient.delete(`/rooms/${roomId}`);
  }

  async getDevices() {
    return httpClient.get('/devices');
  }

  async createDevice(payload) {
    return httpClient.post('/devices', payload);
  }

  async updateDevice(deviceId, payload) {
    return httpClient.patch(`/devices/${deviceId}`, payload);
  }

  async deleteDevice(deviceId) {
    return httpClient.delete(`/devices/${deviceId}`);
  }

  async getSleepConfig() {
    return httpClient.get('/settings/sleep');
  }

  async updateSleepConfig(payload) {
    return httpClient.put('/settings/sleep', payload);
  }

  async getGeneralSettings() {
    return httpClient.get('/settings/general');
  }

  async updateGeneralSettings(payload) {
    return httpClient.put('/settings/general', payload);
  }

  async getSounds() {
    return httpClient.get('/settings/sounds');
  }

  async getTtsSpeakers() {
    return httpClient.get('/settings/tts-speakers');
  }

  async getNotifications() {
    return httpClient.get('/notifications');
  }

  async markAllNotificationsRead() {
    return httpClient.patch('/notifications/read-all');
  }
}
