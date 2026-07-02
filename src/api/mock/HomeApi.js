import { delay, cloneDeep } from './utils';
import { gestureHistory, gestureSets, iotDevices, smartPlugDevices } from '../../data/homeData';
import { getDevicesByClass } from './devicesStore';

class MockApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

function apiError(status, code, message, extra) {
  return new MockApiError(status, code, message, extra);
}

const ACTIVE_ACCOUNT_ID = 'acc_01J2ZQ8M6R9P4T7X3A5B2C1D0E';
let activeAccountId = ACTIVE_ACCOUNT_ID;

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

// 레이더는 자체 저장소가 없다 — settings.md의 GET /devices(class: srs_r4sn)에서 파생한다.
// 방 이름 변경/삭제/비활성화가 여기 자동으로 반영되도록 devicesStore를 직접 조회한다.
function getRadarList() {
  return getDevicesByClass('srs_r4sn').map((device) => ({
    id: device.id,
    name: device.name,
    roomId: device.room_id,
    connected: device.enabled,
  }));
}

function toGesture(item) {
  return { id: `ges_${item.id}`, name: item.name, action: item.action };
}

const gestureSetsSeed = gestureSets.map((set) => ({
  id: set.id,
  name: set.name,
  description: set.description,
  gestures: set.gestures.map(toGesture),
}));

function toHistoryItem(item, index) {
  const radars = getRadarList();
  const radar = radars.find((r) => r.name === item.radar) || radars[0];
  const minutesAgo = { 1: 2, 2: 8, 3: 23, 4: null }[item.id] ?? index * 10;
  const occurredAt = minutesAgo === null
    ? '2026-07-02T09:12:00+09:00'
    : new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  return {
    id: `ges_hist_${item.id}`,
    gesture: item.gesture,
    device: item.device,
    action: item.action,
    occurredAt,
    confidence: item.confidence,
    radarId: radar.id,
    radarName: radar.name,
  };
}

function toDevice(device) {
  return {
    id: device.id,
    name: device.name,
    room: device.room,
    state: device.state,
    connection: device.connection,
    controls: device.controls.map((control) => ({ label: control.label, hint: control.binding })),
  };
}

function toPlug(device) {
  return {
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
  };
}

const historySeed = gestureHistory.map(toHistoryItem);
const devicesSeed = iotDevices.map(toDevice);
const plugsSeed = smartPlugDevices.map(toPlug);

const allGestureIds = new Set(gestureSetsSeed.flatMap((set) => set.gestures.map((g) => g.id)));
const gestureById = new Map(gestureSetsSeed.flatMap((set) => set.gestures).map((g) => [g.id, g]));

let radarAssignments = Object.fromEntries(
  gestureSets
    .flatMap((set) => set.gestures)
    .filter((g) => g.radars && g.radars.length > 0)
    .map((g) => [`ges_${g.id}`, [...g.radars]])
);

// key: `${deviceId}:${controlLabel}` -> gestureId
let deviceBindings = {};

function bindingKey(deviceId, controlLabel) {
  return `${deviceId}:${controlLabel}`;
}

function toBindingEntry(deviceId, controlLabel, gestureId) {
  const gesture = gestureId ? gestureById.get(gestureId) : null;
  return {
    deviceId,
    controlLabel,
    gestureId: gesture ? gesture.id : null,
    gestureName: gesture?.name ?? null,
    action: gesture?.action ?? null,
  };
}

export class HomeApi {
  async getTodayGestureSummary() {
    await delay();
    requireActiveAccount();
    return { recognizedCount: 18 };
  }

  async getGestureHistory() {
    await delay();
    requireActiveAccount();
    return cloneDeep(historySeed);
  }

  async getGestureSets() {
    await delay();
    requireActiveAccount();
    return cloneDeep(gestureSetsSeed);
  }

  async getRadars() {
    await delay();
    requireActiveAccount();
    return cloneDeep(getRadarList());
  }

  async getGestureRadarAssignments() {
    await delay();
    requireActiveAccount();
    return cloneDeep(radarAssignments);
  }

  async updateGestureRadarAssignment(gestureId, radarIds) {
    await delay();
    requireActiveAccount();
    if (!allGestureIds.has(gestureId)) {
      throw apiError(404, 'NOT_FOUND', '제스처를 찾을 수 없습니다.');
    }
    if (!radarIds || radarIds.length === 0) {
      delete radarAssignments[gestureId];
    } else {
      radarAssignments = { ...radarAssignments, [gestureId]: [...radarIds] };
    }
    return { gestureId, radarIds: radarAssignments[gestureId] || [] };
  }

  async getDevices() {
    await delay();
    requireActiveAccount();
    return cloneDeep(devicesSeed);
  }

  async getDeviceBindings() {
    await delay();
    requireActiveAccount();
    return Object.entries(deviceBindings).map(([key, gestureId]) => {
      const [deviceId, controlLabel] = key.split(':');
      return toBindingEntry(deviceId, controlLabel, gestureId);
    });
  }

  async setDeviceBinding({ deviceId, controlLabel, gestureId }) {
    await delay();
    requireActiveAccount();
    const device = devicesSeed.find((item) => item.id === deviceId);
    if (!device || !device.controls.some((control) => control.label === controlLabel)) {
      throw apiError(404, 'NOT_FOUND', '기기 또는 제스처를 찾을 수 없습니다.');
    }
    if (gestureId === null) {
      delete deviceBindings[bindingKey(deviceId, controlLabel)];
      return toBindingEntry(deviceId, controlLabel, null);
    }
    if (!gestureById.has(gestureId)) {
      throw apiError(404, 'NOT_FOUND', '기기 또는 제스처를 찾을 수 없습니다.');
    }
    const inUseElsewhere = Object.entries(deviceBindings).some(
      ([key, boundGestureId]) => boundGestureId === gestureId && key !== bindingKey(deviceId, controlLabel)
    );
    if (inUseElsewhere) {
      throw apiError(400, 'GESTURE_IN_USE', '다른 제어에 이미 사용 중인 제스처입니다.', { field: 'gestureId' });
    }
    deviceBindings = { ...deviceBindings, [bindingKey(deviceId, controlLabel)]: gestureId };
    return toBindingEntry(deviceId, controlLabel, gestureId);
  }

  async clearDeviceBindings(deviceId) {
    await delay();
    requireActiveAccount();
    const device = devicesSeed.find((item) => item.id === deviceId);
    if (!device) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    deviceBindings = Object.fromEntries(
      Object.entries(deviceBindings).filter(([key]) => !key.startsWith(`${deviceId}:`))
    );
    return { deviceId };
  }

  async getPowerPlugs() {
    await delay();
    requireActiveAccount();
    return cloneDeep(plugsSeed);
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
