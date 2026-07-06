import { httpClient } from './httpClient';

// NOTE: these endpoints don't exist on the backend yet (see docs/agent-tool-api.md,
// which lists scheduling/control-logs as future work). Paths mirror the mock
// API's method names 1:1 so swapping REACT_APP_USE_MOCK=false only requires
// the backend to implement these routes — no frontend changes.
export class HomeApi {
  async getSummary() {
    return httpClient.get('/home/summary');
  }

  async getRooms() {
    return httpClient.get('/rooms');
  }

  async getDevices() {
    return httpClient.get('/home/devices');
  }

  async getDeviceCapabilities(deviceId) {
    return httpClient.get(`/home/devices/${deviceId}/capabilities`);
  }

  async getDeviceState(deviceId) {
    return httpClient.get(`/home/devices/${deviceId}/state`);
  }

  async queryDevice(deviceId, queryName) {
    return httpClient.get(`/home/devices/${deviceId}/query/${queryName}`);
  }

  async invokeDevice(deviceId, actionName, params = {}) {
    return httpClient.post(`/home/devices/${deviceId}/actions/${actionName}`, params);
  }

  async reconnectDevice(deviceId) {
    return httpClient.post(`/home/devices/${deviceId}/reconnect`, {});
  }

  async sendTts(deviceId, { text, speakerId } = {}) {
    return httpClient.post(`/home/devices/${deviceId}/tts`, { text, speakerId });
  }

  async getPtzCapabilities(deviceId) {
    return httpClient.get(`/home/devices/${deviceId}/ptz/capabilities`);
  }

  async movePtz(deviceId, vector) {
    return httpClient.post(`/home/devices/${deviceId}/ptz/move`, vector);
  }

  async stopPtz(deviceId) {
    return httpClient.post(`/home/devices/${deviceId}/ptz/stop`, {});
  }

  async zoomPtz(deviceId, delta) {
    return httpClient.post(`/home/devices/${deviceId}/ptz/zoom`, { delta });
  }

  async getStreamInfo(deviceId) {
    return httpClient.get(`/home/devices/${deviceId}/stream`);
  }

  async setStreaming(deviceId, streaming) {
    return httpClient.put(`/home/devices/${deviceId}/stream`, { streaming });
  }

  async captureSnapshot(deviceId) {
    return httpClient.post(`/home/devices/${deviceId}/snapshot`, {});
  }

  async getGestureSets() {
    return httpClient.get('/home/gesture-sets');
  }

  async getGestureSetDefinition(gestureSetId) {
    return httpClient.get(`/home/gesture-sets/${gestureSetId}`);
  }

  async getRadarGestureSet(deviceId) {
    return httpClient.get(`/home/devices/${deviceId}/gesture-set`);
  }

  async setRadarGestureSet(deviceId, gestureSetId) {
    return httpClient.put(`/home/devices/${deviceId}/gesture-set`, { gestureSetId });
  }

  async getRules() {
    return httpClient.get('/home/rules');
  }

  async getRulesForDevice(deviceId) {
    return httpClient.get(`/home/rules?deviceId=${deviceId}`);
  }

  async createRule(rule) {
    return httpClient.post('/home/rules', rule);
  }

  async updateRule(ruleId, patch) {
    return httpClient.put(`/home/rules/${ruleId}`, patch);
  }

  async deleteRule(ruleId) {
    return httpClient.delete(`/home/rules/${ruleId}`);
  }

  async setRuleEnabled(ruleId, enabled) {
    return httpClient.put(`/home/rules/${ruleId}/enabled`, { enabled });
  }

  async executeRuleManually(ruleId) {
    return httpClient.post(`/home/rules/${ruleId}/execute`, {});
  }

  async getIrCommands() {
    return httpClient.get('/home/ir-commands');
  }

  async saveIrCommand(command) {
    return httpClient.put('/home/ir-commands', command);
  }

  async deleteIrCommand(commandId) {
    return httpClient.delete(`/home/ir-commands/${commandId}`);
  }

  async testSendIr(commandId) {
    return httpClient.post(`/home/ir-commands/${commandId}/send`, {});
  }

  async startIrLearn({ timeoutMs = 10000 } = {}) {
    return httpClient.post('/home/ir-commands/learn', { timeoutMs });
  }

  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.types?.length) query.set('types', params.types.join(','));
    if (params.deviceId) query.set('deviceId', params.deviceId);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const qs = query.toString();
    return httpClient.get(`/home/events${qs ? `?${qs}` : ''}`);
  }

  async getPowerPlugs() {
    // @deprecated powerApi.getPlugs() 사용. 하위 호환용.
    return httpClient.get('/power/plugs');
  }
}
