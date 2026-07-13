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

  async getRoomMembers(roomId) {
    return httpClient.get(`/rooms/${roomId}/members`);
  }

  async updateRoomMembers(roomId, accountIds) {
    return httpClient.put(`/rooms/${roomId}/members`, { accountIds });
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

  async assignDeviceToRoom(deviceId, roomId) {
    return httpClient.put(`/devices/${deviceId}/room`, { roomId });
  }

  async unassignDeviceFromRoom(deviceId) {
    return httpClient.delete(`/devices/${deviceId}/room`);
  }

  async getAiModels() {
    return httpClient.get('/settings/ai-models');
  }

  async getAiAgentSettings() {
    return httpClient.get('/settings/ai-agent');
  }

  async updateAiAgentSettings(payload) {
    return httpClient.put('/settings/ai-agent', payload);
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

  async getNotifications(params = {}) {
    return httpClient.get('/notifications', params);
  }

  async markAllNotificationsRead() {
    return httpClient.patch('/notifications/read-all', {});
  }

  async markNotificationRead(notificationId) {
    return httpClient.patch(`/notifications/${notificationId}/read`, {});
  }
}
