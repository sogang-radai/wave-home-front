import { delay, cloneDeep } from '../mock/utils';
import { IotApi as MockIotApi } from '../mock/IotApi';
import { IotApi as RealIotApi } from '../v1/IotApi';
import { guardDemoWrite } from '../../lib/demoGuard';
import { DEMO_POWER_PLUGS } from './powerProfiles';

const realIotApi = new RealIotApi();

async function preferReal(method, fallback) {
  try {
    return await method.call(realIotApi);
  } catch {
    return fallback();
  }
}

function normalizeDeviceList(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function isCameraClass(deviceClass) {
  return deviceClass === 'reolink_e1_pro' || deviceClass === 'droid_cam';
}

export class IotApi extends MockIotApi {
  async getPowerPlugs() {
    const deviceStates = new Map();
    await Promise.all(DEMO_POWER_PLUGS.filter((device) => device.id !== 'all').map(async (device) => {
      try {
        deviceStates.set(device.id, await this.getDeviceState(device.id));
      } catch {
        deviceStates.set(device.id, null);
      }
    }));

    const plugs = DEMO_POWER_PLUGS.filter((device) => device.id !== 'all').map((device) => {
      const state = deviceStates.get(device.id);
      const switchOn = state?.switch ?? device.switch;
      const powerW = switchOn
        ? (state?.power ?? state?.ratedPower ?? device.power_w)
        : 0;
      const voltageV = state?.voltage ?? device.voltage_v;
      const currentMa = switchOn
        ? (state?.current ?? (powerW / voltageV) * 1000)
        : 0;
      return {
        id: device.id,
        name: device.name,
        room: device.room,
        summary: device.summary,
        powerW,
        voltageV,
        currentMa,
        switchOn,
        hourlyCostWon: Math.round(powerW * 0.11 * 10) / 10,
        trend: cloneDeep(device.trend),
      };
    });
    const totalPowerW = plugs.reduce((sum, device) => sum + device.powerW, 0);
    const totalCurrentMa = plugs.reduce((sum, device) => sum + device.currentMa, 0);
    const aggregate = DEMO_POWER_PLUGS.find((device) => device.id === 'all');

    return cloneDeep([{
      id: 'all',
      name: aggregate.name,
      room: aggregate.room,
      summary: aggregate.summary,
      powerW: totalPowerW,
      voltageV: aggregate.voltage_v,
      currentMa: totalCurrentMa,
      switchOn: plugs.some((device) => device.switchOn),
      hourlyCostWon: Math.round(totalPowerW * 0.11 * 10) / 10,
      trend: aggregate.trend,
    }, ...plugs]);
  }

  async getDevices(options = {}) {
    return normalizeDeviceList(
      await preferReal(() => realIotApi.getDevices(options), () => super.getDevices(options)),
    );
  }

  async getDeviceState(deviceId) {
    // Demo device state must stay on the server session. Falling back to the
    // mock store would reset brightness/color to seed values (e.g. 70).
    const state = await realIotApi.getDeviceState(deviceId);
    return state?.state ?? state;
  }

  async invokeDevice(deviceId, actionName, params = {}) {
    const result = await realIotApi.invokeDevice(deviceId, actionName, params);
    return result?.state ?? result;
  }

  async queryDevice(deviceId, queryName) {
    const result = await realIotApi.queryDevice(deviceId, queryName);
    return result?.result ?? result;
  }

  async getGestureSets() {
    return preferReal(realIotApi.getGestureSets, () => super.getGestureSets());
  }

  async getGestureSetDefinition(gestureSetId) {
    return preferReal(
      () => realIotApi.getGestureSetDefinition(gestureSetId),
      () => super.getGestureSetDefinition(gestureSetId),
    );
  }

  async getRadarGestureSet(deviceId) {
    return preferReal(
      () => realIotApi.getRadarGestureSet(deviceId),
      () => super.getRadarGestureSet(deviceId),
    );
  }

  // Reolink 3D POV + PTZ는 실제 카메라가 아니라 트윈 씬을 로컬로 조작하는
  // 시연용 기능이므로 데모 모드에서도 그대로 동작시킨다(쓰기 차단 대상 아님).
  async movePtz(deviceId, params) {
    return super.movePtz(deviceId, params);
  }

  async stopPtz(deviceId) {
    return super.stopPtz(deviceId);
  }

  async zoomPtz(deviceId, delta) {
    return super.zoomPtz(deviceId, delta);
  }

  async setStreaming(deviceId, streaming) {
    return super.setStreaming(deviceId, streaming);
  }

  async captureSnapshot(deviceId) {
    return super.captureSnapshot(deviceId);
  }

  async getStreamInfo(deviceId) {
    await delay(80);
    const devices = await super.getDevices();
    const device = devices.find((item) => item.id === deviceId);
    if (device && isCameraClass(device.class)) {
      return {
        status: 'idle',
        mode: 'placeholder',
        url: null,
        placeholder: true,
        message: '시연용 정적 미리보기',
      };
    }
    return super.getStreamInfo(deviceId);
  }

  async getRules() {
    return preferReal(() => realIotApi.getRules(), () => super.getRules());
  }

  async getRulesForDevice(deviceId) {
    return preferReal(
      () => realIotApi.getRulesForDevice(deviceId),
      () => super.getRulesForDevice(deviceId),
    );
  }

  async createRule(payload) {
    return preferReal(() => realIotApi.createRule(payload), () => super.createRule(payload));
  }

  async updateRule(ruleId, patch) {
    return preferReal(
      () => realIotApi.updateRule(ruleId, patch),
      () => super.updateRule(ruleId, patch),
    );
  }

  async deleteRule(ruleId) {
    return preferReal(() => realIotApi.deleteRule(ruleId), () => super.deleteRule(ruleId));
  }

  async setRuleEnabled(ruleId, enabled) {
    return preferReal(
      () => realIotApi.setRuleEnabled(ruleId, enabled),
      () => super.setRuleEnabled(ruleId, enabled),
    );
  }

  async executeRuleManually(ruleId) {
    return preferReal(
      () => realIotApi.executeRuleManually(ruleId),
      () => super.executeRuleManually(ruleId),
    );
  }

  async saveIrCommand(command) {
    if (!guardDemoWrite()) return null;
    return super.saveIrCommand(command);
  }

  async deleteIrCommand(commandId) {
    if (!guardDemoWrite()) return null;
    return super.deleteIrCommand(commandId);
  }

  async testSendIr(commandId) {
    if (!guardDemoWrite()) return null;
    return super.testSendIr(commandId);
  }

  async setRadarGestureSet(deviceId, gestureSetId) {
    return preferReal(
      () => realIotApi.setRadarGestureSet(deviceId, gestureSetId),
      () => super.setRadarGestureSet(deviceId, gestureSetId),
    );
  }

  subscribeWaveStationTelemetry(deviceId, handlers = {}) {
    return super.subscribeWaveStationTelemetry(deviceId, handlers);
  }
}
