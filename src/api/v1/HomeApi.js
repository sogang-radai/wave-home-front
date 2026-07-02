import { httpClient } from './httpClient';

export class HomeApi {
  async getTodayGestureSummary() {
    return httpClient.get('/home/gestures/today-summary');
  }

  async getGestureHistory() {
    return httpClient.get('/home/gestures/history');
  }

  async getGestureSets() {
    return httpClient.get('/home/gesture-sets');
  }

  async getRadars() {
    return httpClient.get('/home/radars');
  }

  async getGestureRadarAssignments() {
    return httpClient.get('/home/gesture-radar-assignments');
  }

  async updateGestureRadarAssignment(gestureId, radarIds) {
    return httpClient.put(`/home/gesture-radar-assignments/${gestureId}`, { radarIds });
  }

  async getDevices() {
    return httpClient.get('/home/devices');
  }

  async getDeviceBindings() {
    return httpClient.get('/home/device-bindings');
  }

  async setDeviceBinding(payload) {
    return httpClient.put('/home/device-bindings', payload);
  }

  async clearDeviceBindings(deviceId) {
    return httpClient.delete(`/home/device-bindings/${deviceId}`);
  }

  async getPowerPlugs() {
    return httpClient.get('/home/power/plugs');
  }
}
