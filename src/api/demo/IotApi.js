import { delay, cloneDeep } from '../mock/utils';
import { IotApi as MockIotApi } from '../mock/IotApi';
import { guardDemoWrite } from '../../lib/demoGuard';
import { DEMO_POWER_PLUGS } from './powerProfiles';

const DEMO_CAMERA_MSG = '시연 모드에서는 카메라 스트림·PTZ를 사용할 수 없습니다.';

function isCameraClass(deviceClass) {
  return deviceClass === 'reolink_e1_pro' || deviceClass === 'droid_cam';
}

export class IotApi extends MockIotApi {
  async getPowerPlugs() {
    await delay();
    return cloneDeep(DEMO_POWER_PLUGS.map((device) => ({
      id: device.id,
      name: device.name,
      room: device.room,
      summary: device.summary,
      powerW: device.power_w,
      voltageV: device.voltage_v,
      currentMa: device.current_ma,
      switchOn: device.switch,
      hourlyCostWon: device.hourlyCost,
      trend: cloneDeep(device.trend),
    })));
  }

  async movePtz(deviceId, params) {
    if (!guardDemoWrite(DEMO_CAMERA_MSG)) return null;
    return super.movePtz(deviceId, params);
  }

  async stopPtz(deviceId) {
    if (!guardDemoWrite(DEMO_CAMERA_MSG)) return null;
    return super.stopPtz(deviceId);
  }

  async zoomPtz(deviceId, delta) {
    if (!guardDemoWrite(DEMO_CAMERA_MSG)) return null;
    return super.zoomPtz(deviceId, delta);
  }

  async setStreaming(deviceId, streaming) {
    if (streaming && !guardDemoWrite(DEMO_CAMERA_MSG)) return null;
    return super.setStreaming(deviceId, streaming);
  }

  async captureSnapshot(deviceId) {
    if (!guardDemoWrite(DEMO_CAMERA_MSG)) return null;
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

  async createRule(payload) {
    if (!guardDemoWrite()) return null;
    return super.createRule(payload);
  }

  async updateRule(ruleId, patch) {
    if (!guardDemoWrite()) return null;
    return super.updateRule(ruleId, patch);
  }

  async deleteRule(ruleId) {
    if (!guardDemoWrite()) return null;
    return super.deleteRule(ruleId);
  }

  async setRuleEnabled(ruleId, enabled) {
    if (!guardDemoWrite()) return null;
    return super.setRuleEnabled(ruleId, enabled);
  }

  async executeRuleManually(ruleId) {
    if (!guardDemoWrite()) return null;
    return super.executeRuleManually(ruleId);
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
    if (!guardDemoWrite()) return null;
    return super.setRadarGestureSet(deviceId, gestureSetId);
  }
}
