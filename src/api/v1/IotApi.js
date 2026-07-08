import { httpClient, ApiError } from './httpClient';
import { API_BASE_URL } from '../config';

// IoT 제어·룰·이벤트 API. DeviceManager 브리지는 summary/devices/query/actions/events 를 제공한다.
export class IotApi {
  async getSummary() {
    return httpClient.get('/iot/summary');
  }

  async getRooms() {
    return httpClient.get('/rooms');
  }

  async getDevices(options = {}) {
    return httpClient.get('/iot/devices', undefined, options);
  }

  async getDeviceCapabilities(deviceId) {
    return httpClient.get(`/iot/devices/${deviceId}/capabilities`);
  }

  async getDeviceState(deviceId) {
    return httpClient.get(`/iot/devices/${deviceId}/state`);
  }

  async queryDevice(deviceId, queryName) {
    return httpClient.get(`/iot/devices/${deviceId}/query/${queryName}`);
  }

  async invokeDevice(deviceId, actionName, params = {}) {
    return httpClient.post(`/iot/devices/${deviceId}/actions/${actionName}`, params);
  }

  async reconnectDevice(deviceId) {
    return httpClient.post(`/iot/devices/${deviceId}/reconnect`, {});
  }

  async sendTts(deviceId, { text, speakerId } = {}) {
    return httpClient.post(`/iot/devices/${deviceId}/tts`, { text, speakerId });
  }

  async getPtzCapabilities(deviceId) {
    return httpClient.get(`/iot/devices/${deviceId}/ptz/capabilities`);
  }

  async movePtz(deviceId, vector) {
    return httpClient.post(`/iot/devices/${deviceId}/ptz/move`, vector);
  }

  async stopPtz(deviceId) {
    return httpClient.post(`/iot/devices/${deviceId}/ptz/stop`, {});
  }

  async zoomPtz(deviceId, delta) {
    return httpClient.post(`/iot/devices/${deviceId}/ptz/zoom`, { delta });
  }

  async getStreamInfo(deviceId) {
    return httpClient.get(`/iot/devices/${deviceId}/stream`);
  }

  async setStreaming(deviceId, streaming) {
    return httpClient.put(`/iot/devices/${deviceId}/stream`, { streaming });
  }

  async captureSnapshot(deviceId) {
    const token = localStorage.getItem('wavehome_access_token');
    const res = await fetch(`${API_BASE_URL}/iot/devices/${deviceId}/snapshot`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new ApiError(
        res.status,
        payload?.error?.code || 'SNAPSHOT_FAILED',
        payload?.error?.message || '스냅샷 캡처에 실패했습니다.',
      );
    }

    const blob = await res.blob();
    return {
      blob,
      occurredAt: res.headers.get('X-Snapshot-At') || new Date().toISOString(),
      url: URL.createObjectURL(blob),
    };
  }

  async getGestureSets() {
    return httpClient.get('/iot/gesture-sets');
  }

  async getGestureSetDefinition(gestureSetId) {
    return httpClient.get(`/iot/gesture-sets/${gestureSetId}`);
  }

  async getRadarGestureSet(deviceId) {
    return httpClient.get(`/iot/devices/${deviceId}/gesture-set`);
  }

  async setRadarGestureSet(deviceId, gestureSetId) {
    return httpClient.put(`/iot/devices/${deviceId}/gesture-set`, { gestureSetId });
  }

  async getRules() {
    return httpClient.get('/iot/rules');
  }

  async getRulesForDevice(deviceId) {
    return httpClient.get(`/iot/rules?deviceId=${deviceId}`);
  }

  async createRule(rule) {
    return httpClient.post('/iot/rules', rule);
  }

  async updateRule(ruleId, patch) {
    return httpClient.put(`/iot/rules/${ruleId}`, patch);
  }

  async deleteRule(ruleId) {
    return httpClient.delete(`/iot/rules/${ruleId}`);
  }

  async setRuleEnabled(ruleId, enabled) {
    return httpClient.put(`/iot/rules/${ruleId}/enabled`, { enabled });
  }

  async executeRuleManually(ruleId) {
    return httpClient.post(`/iot/rules/${ruleId}/execute`, {});
  }

  async getIrCommands() {
    return httpClient.get('/iot/ir-commands');
  }

  async saveIrCommand(command) {
    return httpClient.put('/iot/ir-commands', command);
  }

  async deleteIrCommand(commandId) {
    return httpClient.delete(`/iot/ir-commands/${commandId}`);
  }

  async testSendIr(commandId) {
    return httpClient.post(`/iot/ir-commands/${commandId}/send`, {});
  }

  async startIrLearn({ timeoutMs = 10000 } = {}) {
    return httpClient.post('/iot/ir-commands/learn', { timeoutMs });
  }

  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.types?.length) query.set('types', params.types.join(','));
    if (params.deviceId) query.set('deviceId', params.deviceId);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const qs = query.toString();
    return httpClient.get(`/iot/events${qs ? `?${qs}` : ''}`);
  }

  async getPowerPlugs() {
    // @deprecated powerApi.getPlugs() 사용. 하위 호환용.
    return httpClient.get('/power/plugs');
  }
}
