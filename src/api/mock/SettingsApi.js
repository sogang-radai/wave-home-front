import { delay, cloneDeep } from './utils';
import {
  getRooms as getRoomsStore,
  addRoom,
  removeRoom,
  getDevices as getDevicesStore,
  getAllDevices,
  addDeviceToBucket,
  findDeviceEntry,
  moveDeviceBucket,
  replaceDeviceAt,
  removeDeviceAt,
} from './devicesStore';

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

function makeHexId() {
  const random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16).padStart(14, '0');
  return `${Date.now().toString(16)}${random}`.slice(-16);
}

function makePrefixedId(prefix) {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
}

function requireName(value, message) {
  const name = value?.trim();
  if (!name) throw apiError(400, 'INVALID_NAME', message, { field: 'name' });
  return name;
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function minutesOf(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function mergeDefined(target, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) target[key] = value;
  });
  return target;
}

const soundsSeed = [
  { id: 'sign-of-the-times', label: 'Sign of the Times' },
  { id: 'love-yourself', label: 'Love Yourself' },
];

const ttsSpeakersSeed = [
  { id: 0, name: '미선', description: '차분하고 안정적인 중저음', character: '침착하고 신뢰감 있는 안내에 어울림', gender: 'female' },
  { id: 1, name: '하은', description: '밝고 경쾌한 고음', character: '명랑하고 친근한 안내에 어울림', gender: 'female' },
  { id: 2, name: '서윤', description: '맑고 전문적인 아나운서 톤', character: '공지와 나레이션에 어울림', gender: 'female' },
  { id: 4, name: '수아', description: '부드럽고 온화한 톤', character: '위로와 휴식 콘텐츠에 어울림', gender: 'female' },
  { id: 6, name: '민준', description: '깊고 묵직한 저음', character: '공식 안내와 설명에 어울림', gender: 'male' },
  { id: 9, name: '현우', description: '따뜻하고 포근한 저중음', character: '오디오북과 휴식 안내에 어울림', gender: 'male' },
];

const accountsSeed = [
  { id: 'acc_01J2ZQ8M6R9P4T7X3A5B2C1D0E', name: '김건강' },
  { id: 'acc_01J2ZQ8YV6E3N9P5K7M1R4T2WA', name: '박웰빙' },
];

const defaultSleepConfig = {
  bedtime: '23:30',
  wakeTime: '07:00',
  wakeUpSound: 'love-yourself',
  acAuto: true,
  acTemp: 24,
  lightAuto: true,
  dimStartMinutes: 30,
  finalBrightness: 10,
  wakeLightRamp: true,
  wakeMusic: true,
  wakeTvOrAlarm: false,
};

const defaultGeneralSettings = {
  theme: 'light',
  language: 'ko',
  notificationSound: 'sign-of-the-times',
  ttsSpeakerId: 0,
};

const notificationsSeed = [
  {
    id: 'noti_01J2ZQA4S2D9M8R6K1P0V3X7YB',
    type: 'timer',
    message: '착석 1시간 48분 경과 — 스트레칭을 해보세요',
    createdAt: '2026-07-02T07:10:00+09:00',
    read: false,
  },
  {
    id: 'noti_01J2ZQAF8K6T3P9W2M5R0C1Y4D',
    type: 'sleep',
    message: '오늘 수면 목표까지 30분 부족합니다',
    createdAt: '2026-07-02T07:12:00+09:00',
    read: false,
  },
  {
    id: 'noti_01J2ZQAS9N2B6C7D0E4F8G1H3K',
    type: 'posture',
    message: '거북목 패턴 4회 감지됨',
    createdAt: '2026-07-02T14:35:00+09:00',
    read: true,
  },
  {
    id: 'noti_01J2ZQB2R5T8Y1U4I7O0P3A6SD',
    type: 'temperature',
    message: '수면 중 실내 온도 자동 조절 작동 (25°C)',
    createdAt: '2026-07-01T23:12:00+09:00',
    read: true,
  },
];

let accounts = cloneDeep(accountsSeed);
let activeAccountId = accountsSeed[0].id;
let sleepConfigs = Object.fromEntries(accountsSeed.map((account) => [account.id, cloneDeep(defaultSleepConfig)]));
let generalSettings = Object.fromEntries(accountsSeed.map((account) => [account.id, cloneDeep(defaultGeneralSettings)]));
let notifications = cloneDeep(notificationsSeed);

function findAccount(accountId) {
  return accounts.find((account) => account.id === accountId);
}

function getActiveAccount() {
  if (!activeAccountId && accounts.length > 0) activeAccountId = accounts[0].id;
  return findAccount(activeAccountId) || null;
}

function ensureRoomExists(roomId) {
  if (!roomId) return;
  if (!getRoomsStore().some((room) => room.id === roomId)) {
    throw apiError(404, 'NOT_FOUND', '방을 찾을 수 없습니다.');
  }
}

function classifyDeviceBucket(deviceClass) {
  return ['srs_r4sn', 'wave_mic', 'wave_cam', 'ir_reciever'].includes(deviceClass)
    ? 'input_devices'
    : 'output_devices';
}

function validateSleepConfig(payload) {
  if (!isValidTime(payload.bedtime) || !isValidTime(payload.wakeTime) || minutesOf(payload.bedtime) === minutesOf(payload.wakeTime)) {
    throw apiError(400, 'INVALID_TIME_RANGE', '취침 시간과 기상 시간을 확인해주세요.', { field: 'bedtime' });
  }

  const details = [];
  if (payload.acTemp < 20 || payload.acTemp > 28) {
    details.push({ field: 'acTemp', code: 'OUT_OF_RANGE', message: '온도는 20~28 사이여야 합니다.' });
  }
  if (payload.dimStartMinutes < 10 || payload.dimStartMinutes > 60) {
    details.push({ field: 'dimStartMinutes', code: 'OUT_OF_RANGE', message: '조명 조절 시작은 10~60분 사이여야 합니다.' });
  }
  if (payload.finalBrightness < 0 || payload.finalBrightness > 30) {
    details.push({ field: 'finalBrightness', code: 'OUT_OF_RANGE', message: '최종 밝기는 0~30 사이여야 합니다.' });
  }
  if (!soundsSeed.some((sound) => sound.id === payload.wakeUpSound)) {
    details.push({ field: 'wakeUpSound', code: 'UNKNOWN_SOUND', message: '존재하지 않는 알람음입니다.' });
  }

  if (details.length > 0) {
    throw apiError(400, 'VALIDATION_ERROR', '입력값을 확인해주세요.', { details });
  }
}

function validateGeneralSettings(payload) {
  if (!ttsSpeakersSeed.some((speaker) => speaker.id === payload.ttsSpeakerId)) {
    throw apiError(400, 'INVALID_SPEAKER', '존재하지 않는 TTS 스피커입니다.', { field: 'ttsSpeakerId' });
  }
  if (!soundsSeed.some((sound) => sound.id === payload.notificationSound)) {
    throw apiError(400, 'INVALID_SOUND', '존재하지 않는 알림음입니다.', { field: 'notificationSound' });
  }
}

export class SettingsApi {
  async getSession() {
    await delay();
    return { activeAccount: cloneDeep(getActiveAccount()) };
  }

  async switchActiveAccount(accountId) {
    await delay();
    const account = findAccount(accountId);
    if (!account) throw apiError(404, 'NOT_FOUND', '구성원을 찾을 수 없습니다.');
    activeAccountId = accountId;
    return { activeAccount: cloneDeep(account) };
  }

  async getAccounts() {
    await delay();
    return cloneDeep(accounts);
  }

  async createAccount({ name }) {
    await delay();
    const account = { id: makePrefixedId('acc'), name: requireName(name, '이름을 입력해주세요.') };
    accounts = [...accounts, account];
    sleepConfigs[account.id] = cloneDeep(defaultSleepConfig);
    generalSettings[account.id] = cloneDeep(defaultGeneralSettings);
    if (!activeAccountId) activeAccountId = account.id;
    return cloneDeep(account);
  }

  async updateAccount(accountId, { name }) {
    await delay();
    const account = findAccount(accountId);
    if (!account) throw apiError(404, 'NOT_FOUND', '구성원을 찾을 수 없습니다.');
    account.name = requireName(name, '이름을 입력해주세요.');
    return cloneDeep(account);
  }

  async deleteAccount(accountId) {
    await delay();
    const account = findAccount(accountId);
    if (!account) throw apiError(404, 'NOT_FOUND', '구성원을 찾을 수 없습니다.');
    if (accountId === activeAccountId) {
      throw apiError(409, 'CANNOT_DELETE_ACTIVE_ACCOUNT', '현재 사용 중인 구성원은 삭제할 수 없습니다.');
    }
    accounts = accounts.filter((item) => item.id !== accountId);
    delete sleepConfigs[accountId];
    delete generalSettings[accountId];
    return { id: accountId };
  }

  async getRooms() {
    await delay();
    return cloneDeep(getRoomsStore());
  }

  async createRoom({ name, description = '' }) {
    await delay();
    const roomName = requireName(name, '방 이름을 입력해주세요.');
    const room = { id: makeHexId(), name: roomName, description: description.trim() || roomName };
    addRoom(room);
    return cloneDeep(room);
  }

  async updateRoom(roomId, { name, description }) {
    await delay();
    const room = getRoomsStore().find((item) => item.id === roomId);
    if (!room) throw apiError(404, 'NOT_FOUND', '방을 찾을 수 없습니다.');
    if (name !== undefined) room.name = requireName(name, '방 이름을 입력해주세요.');
    if (description !== undefined) room.description = description.trim() || room.name;
    return cloneDeep(room);
  }

  async deleteRoom(roomId) {
    await delay();
    const room = getRoomsStore().find((item) => item.id === roomId);
    if (!room) throw apiError(404, 'NOT_FOUND', '방을 찾을 수 없습니다.');
    const hasDevices = getAllDevices().some((device) => device.room_id === roomId);
    if (hasDevices) {
      throw apiError(409, 'ROOM_HAS_DEVICES', '이 방에 연결된 기기가 있어 삭제할 수 없습니다.');
    }
    removeRoom(roomId);
    return { id: roomId };
  }

  async getDevices() {
    await delay();
    return cloneDeep(getDevicesStore());
  }

  async createDevice(payload) {
    await delay();
    ensureRoomExists(payload.room_id);
    const deviceName = requireName(payload.name, '기기 이름을 입력해주세요.');
    if (!payload.class) throw apiError(400, 'INVALID_DEVICE_CLASS', '기기 class를 입력해주세요.', { field: 'class' });

    const device = {
      ...cloneDeep(payload),
      id: payload.id || makeHexId(),
      name: deviceName,
      description: payload.description?.trim() || deviceName,
      enabled: payload.enabled ?? true,
      interface: cloneDeep(payload.interface || {}),
    };
    addDeviceToBucket(classifyDeviceBucket(device.class), device);
    return cloneDeep(device);
  }

  async updateDevice(deviceId, payload) {
    await delay();
    const found = findDeviceEntry(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    if (payload.room_id !== undefined) ensureRoomExists(payload.room_id);

    const updated = mergeDefined({ ...found.device }, cloneDeep(payload));
    if (payload.name !== undefined) updated.name = requireName(payload.name, '기기 이름을 입력해주세요.');
    if (payload.description !== undefined) updated.description = payload.description.trim() || updated.name;

    const nextBucket = classifyDeviceBucket(updated.class);
    if (nextBucket !== found.bucket) {
      moveDeviceBucket(found, nextBucket, updated);
    } else {
      replaceDeviceAt(found, updated);
    }

    return cloneDeep(updated);
  }

  async deleteDevice(deviceId) {
    await delay();
    const found = findDeviceEntry(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    removeDeviceAt(found);
    return { id: deviceId };
  }

  async getSleepConfig() {
    await delay();
    const account = getActiveAccount();
    if (!account) throw apiError(404, 'NOT_FOUND', '활성 구성원을 찾을 수 없습니다.');
    return cloneDeep(sleepConfigs[account.id] || defaultSleepConfig);
  }

  async updateSleepConfig(payload) {
    await delay();
    const account = getActiveAccount();
    if (!account) throw apiError(404, 'NOT_FOUND', '활성 구성원을 찾을 수 없습니다.');
    const next = { ...defaultSleepConfig, ...cloneDeep(payload) };
    validateSleepConfig(next);
    sleepConfigs[account.id] = next;
    return cloneDeep(next);
  }

  async getGeneralSettings() {
    await delay();
    const account = getActiveAccount();
    if (!account) throw apiError(404, 'NOT_FOUND', '활성 구성원을 찾을 수 없습니다.');
    return cloneDeep(generalSettings[account.id] || defaultGeneralSettings);
  }

  async updateGeneralSettings(payload) {
    await delay();
    const account = getActiveAccount();
    if (!account) throw apiError(404, 'NOT_FOUND', '활성 구성원을 찾을 수 없습니다.');
    const next = { ...defaultGeneralSettings, ...cloneDeep(payload) };
    validateGeneralSettings(next);
    generalSettings[account.id] = next;
    return cloneDeep(next);
  }

  async getSounds() {
    await delay();
    return cloneDeep(soundsSeed);
  }

  async getTtsSpeakers() {
    await delay();
    return cloneDeep(ttsSpeakersSeed);
  }

  async getNotifications() {
    await delay();
    return cloneDeep(notifications);
  }

  async markAllNotificationsRead() {
    await delay();
    notifications = notifications.map((notification) => ({ ...notification, read: true }));
    return cloneDeep(notifications);
  }
}
