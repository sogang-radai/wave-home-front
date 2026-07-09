import { delay, cloneDeep, nextNumericId } from './utils';
import { getAllDevices, getRooms } from './devicesStore';
import { getClassInfo, findAction } from './deviceClassRegistry';
import { ruleSeed } from '../../data/ruleData';
import { irCommandSeed, validateTimings } from '../../data/irCommandData';
import { gestureSetRegistry, gestureSetDefinitions } from '../../data/gestureSetData';
import { smartPlugDevices } from '../../data/homeData';
import { sortDevicesForControl } from '../../utils/deviceSort';

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

const ACTIVE_ACCOUNT_ID = 1;
let activeAccountId = ACTIVE_ACCOUNT_ID;

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}

// ── Device runtime state ────────────────────────────────────────────────────
// device_list.json only describes registration/interface config (settings.md's
// domain). Home Control additionally needs a *runtime* view — connection
// status + the class-specific state that Queryable/Actionable would report on
// a real device — which this module owns.

function isCameraClass(deviceClass) {
  return deviceClass === 'reolink_e1_pro' || deviceClass === 'droid_cam';
}

function initialStateFor(deviceClass) {
  switch (deviceClass) {
    case 'tuya_ep2h':
      return { switch: true, voltage: 234.6, current: 118.2, power: 27.7, energy: 12.4 };
    case 'philips_wiz_e29_color':
      return { on: true, brightness: 70, color: { r: 255, g: 196, b: 120 }, temperature: 4000 };
    case 'philips_wiz_e29_white':
      return { on: true, brightness: 55, temperature: 4200 };
    case 'samsung_g7':
    case 'tizen_tv':
      return { on: false, volume: 12, channel: 7, muted: false, app: null };
    case 'reolink_e1_pro':
      return { streaming: false, zoom: 0, ptz: { pan: 0, tilt: 0 }, micLevel: 0.08 };
    case 'droid_cam':
      return { streaming: false, micLevel: 0.06 };
    case 'srs_r4sn':
      return { gestureSetId: 'desk_set' };
    case 'wave_station':
      return { micLevel: 0.12, env: { lux: 220, tempC: 24.1, humidity: 41 } };
    default:
      return {};
  }
}

function onFieldFor(deviceClass) {
  return deviceClass === 'tuya_ep2h' ? 'switch' : 'on';
}

const runtimeSeed = getAllDevices().map((device) => ({
  deviceId: device.id,
  // 부엌 조명만 오프라인으로 시드해서 로그/상태 배지가 실제로 갈리는 걸 보여준다.
  connected: device.id !== '6a1e4b8d3f05c927',
  lastSeenAt: device.id === '6a1e4b8d3f05c927' ? isoAgo(46 * 60 * 1000) : isoAgo(5 * 1000),
  state: initialStateFor(device.class),
}));

let runtimeById = new Map(runtimeSeed.map((entry) => [entry.deviceId, entry]));

function findDeviceOrThrow(deviceId) {
  const device = getAllDevices().find((item) => item.id === deviceId);
  if (!device) throw apiError(404, 'NOT_FOUND', '장치를 찾을 수 없습니다.');
  const runtime = runtimeById.get(deviceId);
  return { device, runtime };
}

function stateSummaryFor(device, runtime) {
  const s = runtime.state;
  if (!runtime.connected) return '연결 끊김';
  switch (device.class) {
    case 'tuya_ep2h':
      return `${s.switch ? '켜짐' : '꺼짐'} · ${(s.switch ? s.power : 0).toFixed(1)}W`;
    case 'philips_wiz_e29_color':
      return `${s.on ? '켜짐' : '꺼짐'}${s.on ? ` · 밝기 ${s.brightness}%` : ''}`;
    case 'philips_wiz_e29_white':
      return `${s.on ? '켜짐' : '꺼짐'}${s.on ? ` · ${s.temperature}K` : ''}`;
    case 'samsung_g7':
    case 'tizen_tv':
      return s.on ? `켜짐 · 볼륨 ${s.volume}${s.muted ? ' (음소거)' : ''}` : '꺼짐';
    case 'reolink_e1_pro':
    case 'droid_cam':
      return s.streaming ? '스트리밍 중' : '대기 중';
    case 'srs_r4sn':
      return `제스처 셋: ${gestureSetDefinitions[s.gestureSetId]?.name || '미지정'}`;
    case 'wave_station':
      return `마이크 레벨 ${Math.round(s.micLevel * 100)}%`;
    default:
      return device.enabled ? '활성' : '비활성';
  }
}

function roomLookup() {
  return new Map(getRooms().map((room) => [room.id, room]));
}

function toDeviceView(device) {
  const runtime = runtimeById.get(device.id);
  const classInfo = getClassInfo(device.class);
  const room = roomLookup().get(device.room_id);
  return {
    id: device.id,
    name: device.name,
    description: device.description,
    vendor: device.vendor,
    model: device.model,
    class: device.class,
    classLabel: classInfo.label,
    panel: classInfo.panel,
    room: room ? { id: room.id, name: room.name } : null,
    enabled: device.enabled,
    connected: runtime.connected,
    connectionStatus: runtime.connected ? 'online' : 'offline',
    available: true,
    connectionError: runtime.connected ? undefined : { code: -4, message: '연결 끊김' },
    lastSeenAt: runtime.lastSeenAt,
    stateSummary: stateSummaryFor(device, runtime),
  };
}

// ── Event log ────────────────────────────────────────────────────────────────
// Unified timeline across connection / gesture / execution / schedule / ir.
let events = [
  { id: 1, type: 'connection', occurredAt: isoAgo(46 * 60 * 1000), deviceId: '6a1e4b8d3f05c927', deviceName: '부엌 조명', message: '연결 끊김 (응답 없음)', triggeredBy: null, detail: { reason: 'timeout', lastRttMs: 812 } },
  { id: 2, type: 'gesture', occurredAt: isoAgo(3 * 60 * 1000), deviceId: '3a7f2c9d10b4e85f', deviceName: '침실 하방 레이더', message: '제스처 인식: 오른손 반짝 (classId 7)', triggeredBy: null, detail: { classId: 7, className: '오른손 반짝', confidence: 0.93 } },
  { id: 3, type: 'execution', occurredAt: isoAgo(3 * 60 * 1000 - 400), deviceId: '5d0a3f8c26b91e74', deviceName: '거실 조명', message: '룰 실행: 책상 반짝 제스처로 조명 켜기 → on', triggeredBy: 'rule:1', detail: { action: 'on', params: {} } },
  { id: 4, type: 'gesture', occurredAt: isoAgo(9 * 60 * 1000), deviceId: '3a7f2c9d10b4e85f', deviceName: '침실 하방 레이더', message: '제스처 인식: 오른손 시계방향 (classId 10)', triggeredBy: null, detail: { classId: 10, className: '오른손 시계방향', confidence: 0.89 } },
  { id: 5, type: 'execution', occurredAt: isoAgo(9 * 60 * 1000 - 200), deviceId: '2c9f6a1b4d78e350', deviceName: 'TV', message: '룰 실행: 오른손 시계방향 → TV 볼륨 연속 증가 → volume_up', triggeredBy: 'rule:2', detail: { action: 'volume_up', params: {} } },
  { id: 6, type: 'ir', occurredAt: isoAgo(20 * 60 * 1000), deviceId: '5c1e8b6402fda973', deviceName: 'Wave Station', message: 'IR 수신: 에어컨 전원', triggeredBy: null, detail: { direction: 'received', commandId: 1 } },
  { id: 7, type: 'execution', occurredAt: isoAgo(20 * 60 * 1000 - 150), deviceId: '6b0f3e8a92c47d15', deviceName: '플러그1', message: '룰 실행: IR 수신 시 플러그1 토글 → toggle', triggeredBy: 'rule:3', detail: { action: 'toggle', params: {} } },
  { id: 8, type: 'schedule', occurredAt: isoAgo(60 * 60 * 1000), deviceId: '2c9f6a1b4d78e350', deviceName: 'TV', message: '예약 실행: 30분 뒤 TV 끄기 → off', triggeredBy: 'schedule:6', detail: { action: 'off', params: {} } },
  { id: 9, type: 'connection', occurredAt: isoAgo(3 * 60 * 60 * 1000), deviceId: '6a1e4b8d3f05c927', deviceName: '부엌 조명', message: '연결됨', triggeredBy: null, detail: { rttMs: 64 } },
  { id: 10, type: 'execution', occurredAt: isoAgo(5 * 60 * 60 * 1000), deviceId: '1f8c5a2e7b93064d', deviceName: '플러그2', message: '룰 실행: 플러그2 과부하 시 자동 차단 → off', triggeredBy: 'rule:4', detail: { action: 'off', params: {}, power: 1584 } },
  { id: 11, type: 'ir', occurredAt: isoAgo(7 * 60 * 60 * 1000), deviceId: null, deviceName: 'IR 목록', message: '테스트 전송: TV 볼륨 올리기', triggeredBy: null, detail: { direction: 'sent', commandId: 5 } },
  { id: 12, type: 'schedule', occurredAt: isoAgo(22 * 60 * 60 * 1000), deviceId: '5d0a3f8c26b91e74', deviceName: '거실 조명', message: '예약 실행: 매일 22:30 거실 조명 밝기 낮춤 → brightness(20)', triggeredBy: 'schedule:5', detail: { action: 'brightness', params: { value: 20 } } },
  { id: 13, type: 'gesture', occurredAt: isoAgo(24 * 60 * 60 * 1000), deviceId: '3a7f2c9d10b4e85f', deviceName: '침실 하방 레이더', message: '제스처 인식: 왼쪽 스와이프 (classId 5)', triggeredBy: null, detail: { classId: 5, className: '왼쪽 스와이프', confidence: 0.81 } },
  { id: 14, type: 'connection', occurredAt: isoAgo(26 * 60 * 60 * 1000), deviceId: '27d9a4f3c85b016e', deviceName: '거실 카메라', message: '연결됨', triggeredBy: null, detail: { rttMs: 41 } },
  { id: 15, type: 'execution', occurredAt: isoAgo(30 * 60 * 60 * 1000), deviceId: '6b0f3e8a92c47d15', deviceName: '플러그1', message: '수동 제어: on', triggeredBy: 'manual', detail: { action: 'on', params: {} } },
];

let nextEventId = 20;

function logEvent(entry) {
  const event = { id: nextEventId++, ...entry };
  events = [event, ...events].slice(0, 300);
  return event;
}

function deviceNameOf(deviceId) {
  return getAllDevices().find((d) => d.id === deviceId)?.name ?? deviceId;
}

// ── Rules ────────────────────────────────────────────────────────────────────
let rules = cloneDeep(ruleSeed);
const ruleLastFiredAt = {};

function validateRulePayload(rule) {
  if (!rule || typeof rule !== 'object') throw apiError(400, 'INVALID_RULE', '룰 데이터가 올바르지 않습니다.');
  if (!rule.name || !rule.name.trim()) throw apiError(400, 'INVALID_NAME', '룰 이름을 입력해주세요.', { field: 'name' });
  if (!rule.action || !rule.action.deviceId || !rule.action.name) {
    throw apiError(400, 'INVALID_ACTION', '실행할 장치와 동작을 선택해주세요.', { field: 'action' });
  }
  if (!rule.trigger && !rule.schedule) {
    throw apiError(400, 'INVALID_RULE', '트리거 또는 예약 중 하나는 반드시 설정해야 합니다.');
  }
  const action = findAction(getAllDevices().find((d) => d.id === rule.action.deviceId)?.class, rule.action.name);
  if (action) {
    const attrs = action.attributes || [];
    if (rule.execMode === 'toggle' && !attrs.includes('Toggle')) {
      throw apiError(400, 'INVALID_EXEC_MODE', '이 동작은 토글을 지원하지 않습니다.', { field: 'execMode' });
    }
    if (rule.execMode === 'repeat' && !attrs.includes('Repeat')) {
      throw apiError(400, 'INVALID_EXEC_MODE', '이 동작은 연속 실행을 지원하지 않습니다.', { field: 'execMode' });
    }
  }
}

function toRuleView(rule) {
  return {
    ...cloneDeep(rule),
    actionDeviceName: deviceNameOf(rule.action.deviceId),
    triggerDeviceName: rule.trigger?.deviceId ? deviceNameOf(rule.trigger.deviceId) : null,
  };
}

// ── IR commands ──────────────────────────────────────────────────────────────
let irCommands = cloneDeep(irCommandSeed);

function randomLearnedTimings() {
  const pairCount = 8 + Math.floor(Math.random() * 8);
  const timings = [9000, 4500];
  for (let i = 0; i < pairCount; i++) {
    timings.push(560, Math.random() > 0.5 ? 1690 : 560);
  }
  timings.push(560, 39000);
  return timings;
}

// ── Gesture sets ─────────────────────────────────────────────────────────────
function toGestureSetSummary(entry) {
  const def = gestureSetDefinitions[entry.id];
  return {
    id: entry.id,
    name: entry.name,
    path: entry.path,
    enabled: entry.enabled,
    description: def?.description ?? '',
    classCount: def?.classes.length ?? 0,
    triggerClassCount: def?.classes.filter((c) => c.kind === 'trigger').length ?? 0,
  };
}

export class IotApi {
  // ── Summary ────────────────────────────────────────────────────────────────
  async getSummary() {
    await delay();
    requireActiveAccount();
    const devices = getAllDevices();
    const onlineCount = devices.filter((d) => runtimeById.get(d.id)?.connected).length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const todayEventCount = events.filter((e) => new Date(e.occurredAt).getTime() >= dayAgo).length;
    const activeRuleCount = rules.filter((r) => r.enabled).length;
    return {
      onlineDeviceCount: onlineCount,
      totalDeviceCount: devices.length,
      initializingDeviceCount: 0,
      devicesStarting: false,
      todayEventCount,
      activeRuleCount,
    };
  }

  // ── Devices ────────────────────────────────────────────────────────────────
  async getRooms() {
    await delay();
    requireActiveAccount();
    return cloneDeep(getRooms());
  }

  async getDevices() {
    await delay();
    requireActiveAccount();
    return sortDevicesForControl(getAllDevices().map(toDeviceView));
  }

  async getDeviceCapabilities(deviceId) {
    await delay();
    requireActiveAccount();
    const { device } = findDeviceOrThrow(deviceId);
    return cloneDeep(getClassInfo(device.class));
  }

  async getDeviceState(deviceId) {
    await delay();
    requireActiveAccount();
    const { runtime } = findDeviceOrThrow(deviceId);
    return cloneDeep(runtime.state);
  }

  async queryDevice(deviceId, queryName) {
    await delay(150);
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    if (device.class === 'tuya_ep2h' && ['power', 'voltage', 'current', 'status'].includes(queryName)) {
      // Live-ish jitter so the plug panel feels like it's polling real telemetry.
      // Power/current decay toward ~0 while switched off, like a real plug.
      const target = runtime.state.switch ? runtime.state.power : 0;
      runtime.state.power = clamp(target + (Math.random() - 0.5) * (runtime.state.switch ? 3 : 0.4), 0, 3000);
      runtime.state.current = clamp((runtime.state.switch ? runtime.state.current : 0) + (Math.random() - 0.5) * (runtime.state.switch ? 8 : 1), 0, 16000);
      runtime.state.voltage = clamp(235 + (runtime.state.voltage - 235) * 0.3 + (Math.random() - 0.5) * 0.08, 233, 237);
      runtime.state.energy = +(runtime.state.energy + runtime.state.power / 3600 / 1000).toFixed(4);
    }
    if (device.class === 'wave_station' && ['mic_level', 'env', 'status'].includes(queryName)) {
      runtime.state.micLevel = clamp(runtime.state.micLevel + (Math.random() - 0.5) * 0.1, 0, 1);
    }
    if (isCameraClass(device.class) && ['mic_level', 'status'].includes(queryName)) {
      runtime.state.micLevel = clamp((runtime.state.micLevel ?? 0.08) + (Math.random() - 0.5) * 0.12, 0, 1);
    }
    if (queryName === 'status' || queryName === 'state' || queryName === 'capabilities') {
      if (queryName === 'capabilities') return cloneDeep(getClassInfo(device.class).capabilities || {});
      return cloneDeep(runtime.state);
    }
    return { [queryName]: cloneDeep(runtime.state[queryName]) };
  }

  async invokeDevice(deviceId, actionName, params = {}) {
    await delay(200);
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    const action = findAction(device.class, actionName);
    if (!action) throw apiError(404, 'ACTION_NOT_FOUND', `'${actionName}' 동작을 찾을 수 없습니다.`);
    if (!runtime.connected) throw apiError(409, 'DEVICE_OFFLINE', '장치가 오프라인 상태입니다.');
    const s = runtime.state;
    const onField = onFieldFor(device.class);
    switch (actionName) {
      case 'on': s[onField] = true; break;
      case 'off': s[onField] = false; break;
      case 'toggle': s[onField] = !s[onField]; break;
      case 'brightness': s.brightness = clamp(Number(params.value) || 0, 10, 100); break;
      case 'color': s.color = { r: clamp(+params.r || 0, 0, 255), g: clamp(+params.g || 0, 0, 255), b: clamp(+params.b || 0, 0, 255) }; break;
      case 'temperature': s.temperature = clamp(Number(params.value) || 4000, 2200, 6500); break;
      case 'volume_up': s.volume = clamp((s.volume || 0) + 1, 0, 100); break;
      case 'volume_down': s.volume = clamp((s.volume || 0) - 1, 0, 100); break;
      case 'mute': s.muted = !s.muted; break;
      case 'channel_up': s.channel = (s.channel || 0) + 1; break;
      case 'channel_down': s.channel = Math.max(0, (s.channel || 0) - 1); break;
      case 'open_app': s.app = params.app; s.on = true; break;
      case 'send_ir': s.lastIrSentId = params.commandId; break;
      default: break;
    }
    logEvent({ type: 'execution', occurredAt: new Date().toISOString(), deviceId, deviceName: device.name, message: `수동 제어: ${actionName}`, triggeredBy: 'manual', detail: { action: actionName, params } });
    return cloneDeep(s);
  }

  // 카드의 재연결 버튼 — 지연 후 연결 상태만 복구한다(실제 재접속 로직은 없음).
  async reconnectDevice(deviceId) {
    await delay(700);
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    runtime.connected = true;
    runtime.lastSeenAt = new Date().toISOString();
    logEvent({
      type: 'connection',
      occurredAt: new Date().toISOString(),
      deviceId,
      deviceName: device.name,
      message: '재연결됨',
      triggeredBy: 'manual',
      detail: { rttMs: Math.round(30 + Math.random() * 80) },
    });
    return toDeviceView(device);
  }

  // 카메라/Wave Station의 TTS 패널에서 공용으로 사용 — 실제 오디오 합성/재생 없이 이벤트만 남긴다.
  async sendTts(deviceId, { text, speakerId } = {}) {
    await delay(300);
    requireActiveAccount();
    const { device } = findDeviceOrThrow(deviceId);
    if (!text || !text.trim()) throw apiError(400, 'INVALID_TEXT', '재생할 텍스트를 입력해주세요.', { field: 'text' });
    logEvent({
      type: 'execution',
      occurredAt: new Date().toISOString(),
      deviceId,
      deviceName: device.name,
      message: `TTS 재생: "${text.length > 24 ? `${text.slice(0, 24)}…` : text}"`,
      triggeredBy: 'manual',
      detail: { text, speakerId },
    });
    return { ok: true };
  }

  // ── PTZ / camera ─────────────────────────────────────────────────────────
  async getPtzCapabilities(deviceId) {
    await delay();
    requireActiveAccount();
    const { device } = findDeviceOrThrow(deviceId);
    if (!isCameraClass(device.class)) throw apiError(400, 'UNSUPPORTED', 'PTZ를 지원하지 않는 장치입니다.');
    return { pan: true, tilt: true, zoom: true, home: true, presets: [{ id: 1, name: '홈' }, { id: 2, name: '현관' }] };
  }

  async movePtz(deviceId, { pan, tilt }) {
    await delay(80);
    requireActiveAccount();
    const { runtime } = findDeviceOrThrow(deviceId);
    runtime.state.ptz = { pan: clamp(pan, -1, 1), tilt: clamp(tilt, -1, 1) };
    return cloneDeep(runtime.state.ptz);
  }

  async stopPtz(deviceId) {
    await delay(50);
    requireActiveAccount();
    const { runtime } = findDeviceOrThrow(deviceId);
    runtime.state.ptz = { pan: 0, tilt: 0 };
    return cloneDeep(runtime.state.ptz);
  }

  async zoomPtz(deviceId, delta) {
    await delay(80);
    requireActiveAccount();
    const { runtime } = findDeviceOrThrow(deviceId);
    runtime.state.zoom = clamp((runtime.state.zoom || 0) + delta, 0, 100);
    return { zoom: runtime.state.zoom };
  }

  async getStreamInfo(deviceId) {
    await delay(300);
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    const mode = device.class === 'droid_cam' ? 'mjpeg' : 'mse';
    return {
      status: runtime.state.streaming ? 'streaming' : 'idle',
      mode,
      url: runtime.state.streaming && mode === 'mjpeg'
        ? `/api/v1/iot/devices/${deviceId}/stream/mjpeg`
        : null,
    };
  }

  async setStreaming(deviceId, streaming) {
    await delay(400);
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    runtime.state.streaming = !!streaming;
    const mode = device.class === 'droid_cam' ? 'mjpeg' : 'mse';
    return {
      status: runtime.state.streaming ? 'streaming' : 'idle',
      mode,
      url: runtime.state.streaming && mode === 'mjpeg'
        ? `/api/v1/iot/devices/${deviceId}/stream/mjpeg`
        : null,
    };
  }

  async captureSnapshot(deviceId) {
    await delay(200);
    requireActiveAccount();
    findDeviceOrThrow(deviceId);
    return { occurredAt: new Date().toISOString() };
  }

  // ── Radar ↔ gesture set ──────────────────────────────────────────────────
  async getGestureSets() {
    await delay();
    requireActiveAccount();
    return gestureSetRegistry.map(toGestureSetSummary);
  }

  async getGestureSetDefinition(gestureSetId) {
    await delay();
    requireActiveAccount();
    const def = gestureSetDefinitions[gestureSetId];
    if (!def) throw apiError(404, 'NOT_FOUND', '제스처 셋을 찾을 수 없습니다.');
    return cloneDeep({ id: gestureSetId, ...def });
  }

  async getRadarGestureSet(deviceId) {
    await delay();
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    if (device.class !== 'srs_r4sn') throw apiError(400, 'UNSUPPORTED', '레이더 장치가 아닙니다.');
    return { deviceId, gestureSetId: runtime.state.gestureSetId || null };
  }

  async setRadarGestureSet(deviceId, gestureSetId) {
    await delay();
    requireActiveAccount();
    const { device, runtime } = findDeviceOrThrow(deviceId);
    if (device.class !== 'srs_r4sn') throw apiError(400, 'UNSUPPORTED', '레이더 장치가 아닙니다.');
    if (gestureSetId && !gestureSetDefinitions[gestureSetId]) throw apiError(404, 'NOT_FOUND', '제스처 셋을 찾을 수 없습니다.');
    runtime.state.gestureSetId = gestureSetId || null;
    return { deviceId, gestureSetId: runtime.state.gestureSetId };
  }

  // ── Rules ──────────────────────────────────────────────────────────────────
  async getRules() {
    await delay();
    requireActiveAccount();
    return rules.map(toRuleView);
  }

  async getRulesForDevice(deviceId) {
    await delay();
    requireActiveAccount();
    return rules.filter((r) => r.trigger?.deviceId === deviceId || r.action.deviceId === deviceId).map(toRuleView);
  }

  async createRule(rule) {
    await delay();
    requireActiveAccount();
    validateRulePayload(rule);
    const newRule = {
      id: nextNumericId(),
      enabled: true,
      cooldownMs: 0,
      trigger: null,
      schedule: null,
      ...cloneDeep(rule),
    };
    rules = [...rules, newRule];
    return toRuleView(newRule);
  }

  async updateRule(ruleId, patch) {
    await delay();
    requireActiveAccount();
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index === -1) throw apiError(404, 'NOT_FOUND', '룰을 찾을 수 없습니다.');
    const merged = { ...rules[index], ...cloneDeep(patch) };
    validateRulePayload(merged);
    rules = rules.map((r, i) => (i === index ? merged : r));
    return toRuleView(merged);
  }

  async deleteRule(ruleId) {
    await delay();
    requireActiveAccount();
    if (!rules.some((r) => r.id === ruleId)) throw apiError(404, 'NOT_FOUND', '룰을 찾을 수 없습니다.');
    rules = rules.filter((r) => r.id !== ruleId);
    return { id: ruleId };
  }

  async setRuleEnabled(ruleId, enabled) {
    await delay();
    requireActiveAccount();
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index === -1) throw apiError(404, 'NOT_FOUND', '룰을 찾을 수 없습니다.');
    rules = rules.map((r, i) => (i === index ? { ...r, enabled: !!enabled } : r));
    return toRuleView(rules[index]);
  }

  // 데모용 수동 실행 — 실제 트리거 스트림이 없으므로 "테스트 실행" 버튼에서 호출한다.
  async executeRuleManually(ruleId) {
    await delay(200);
    requireActiveAccount();
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) throw apiError(404, 'NOT_FOUND', '룰을 찾을 수 없습니다.');
    if (!rule.enabled) throw apiError(409, 'RULE_DISABLED', '비활성화된 룰입니다.');
    const now = Date.now();
    const lastFired = ruleLastFiredAt[ruleId] || 0;
    if (rule.cooldownMs > 0 && now - lastFired < rule.cooldownMs) {
      return { skipped: true, reason: 'cooldown', remainingMs: rule.cooldownMs - (now - lastFired) };
    }
    ruleLastFiredAt[ruleId] = now;
    const state = await this.invokeDevice(rule.action.deviceId, rule.action.name, rule.action.params || {});
    const source = rule.schedule ? `schedule:${rule.id}` : `rule:${rule.id}`;
    logEvent({
      type: rule.schedule ? 'schedule' : 'execution',
      occurredAt: new Date().toISOString(),
      deviceId: rule.action.deviceId,
      deviceName: deviceNameOf(rule.action.deviceId),
      message: `${rule.schedule ? '예약' : '룰'} 실행: ${rule.name} → ${rule.action.name}`,
      triggeredBy: source,
      detail: { action: rule.action.name, params: rule.action.params || {} },
    });
    return { skipped: false, state };
  }

  // ── IR commands ──────────────────────────────────────────────────────────
  async getIrCommands() {
    await delay();
    requireActiveAccount();
    return cloneDeep(irCommands);
  }

  async saveIrCommand(command) {
    await delay();
    requireActiveAccount();
    if (!command?.name?.trim()) throw apiError(400, 'INVALID_NAME', '커맨드 이름을 입력해주세요.', { field: 'name' });
    const error = validateTimings(command.timings);
    if (error) throw apiError(400, 'INVALID_TIMINGS', error, { field: 'timings' });
    const existingIndex = command.id ? irCommands.findIndex((c) => c.id === command.id) : -1;
    if (existingIndex !== -1) {
      const updated = { ...irCommands[existingIndex], ...cloneDeep(command) };
      irCommands = irCommands.map((c, i) => (i === existingIndex ? updated : c));
      return cloneDeep(updated);
    }
    const created = {
      id: nextNumericId(),
      unit: 'us',
      source: command.source || 'manual',
      createdAt: new Date().toISOString(),
      ...cloneDeep(command),
    };
    irCommands = [...irCommands, created];
    return cloneDeep(created);
  }

  async deleteIrCommand(commandId) {
    await delay();
    requireActiveAccount();
    if (!irCommands.some((c) => c.id === commandId)) throw apiError(404, 'NOT_FOUND', '커맨드를 찾을 수 없습니다.');
    irCommands = irCommands.filter((c) => c.id !== commandId);
    return { id: commandId };
  }

  async testSendIr(commandId) {
    await delay(150);
    requireActiveAccount();
    const command = irCommands.find((c) => c.id === commandId);
    if (!command) throw apiError(404, 'NOT_FOUND', '커맨드를 찾을 수 없습니다.');
    const waveStation = getAllDevices().find((d) => d.class === 'wave_station');
    if (!waveStation) throw apiError(404, 'NOT_FOUND', 'Wave Station 장치를 찾을 수 없습니다.');
    const state = await this.invokeDevice(waveStation.id, 'send_ir', { commandId: String(commandId) });
    logEvent({
      type: 'ir',
      occurredAt: new Date().toISOString(),
      deviceId: waveStation.id,
      deviceName: waveStation.name,
      message: `IR 전송: ${command.name}`,
      triggeredBy: 'manual',
      detail: { direction: 'sent', commandId },
    });
    return { ok: true, deviceId: waveStation.id, action: 'send_ir', state };
  }

  // 10초 학습 창: 2~4초 뒤 무작위 timings로 resolve, timeoutMs 경과 시 reject.
  startIrLearn({ deviceId, timeoutMs = 10000 } = {}) {
    requireActiveAccount();
    if (!deviceId) throw apiError(400, 'INVALID_BODY', 'Wave Station 장치를 선택해주세요.');
    const waveStation = getAllDevices().find((d) => d.id === deviceId && d.class === 'wave_station');
    if (!waveStation) throw apiError(404, 'NOT_FOUND', 'Wave Station 장치를 찾을 수 없습니다.');
    return new Promise((resolve, reject) => {
      const learnDelayMs = 2000 + Math.random() * 2000;
      let settled = false;
      const learnTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        resolve({ timings: randomLearnedTimings() });
      }, Math.min(learnDelayMs, Math.max(0, timeoutMs - 100)));
      const timeoutTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        clearTimeout(learnTimer);
        reject(apiError(408, 'IR_LEARN_TIMEOUT', '리모컨 신호를 받지 못했습니다. 다시 시도해주세요.'));
      }, timeoutMs);
    });
  }

  // ── Event log ──────────────────────────────────────────────────────────────
  async getEvents({ types, deviceId, from, to } = {}) {
    await delay();
    requireActiveAccount();
    const fromTs = from ? new Date(from).getTime() : -Infinity;
    const toTs = to ? new Date(to).getTime() : Infinity;
    return cloneDeep(
      events
        .filter((e) => !types || types.length === 0 || types.includes(e.type))
        .filter((e) => !deviceId || e.deviceId === deviceId)
        .filter((e) => {
          const ts = new Date(e.occurredAt).getTime();
          return ts >= fromTs && ts <= toTs;
        })
        .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    );
  }

  // ── Power (unchanged from previous IotApi) ─────────────────────────────────
  async getPowerPlugs() {
    await delay();
    requireActiveAccount();
    return cloneDeep(smartPlugDevices.map((device) => ({
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

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
