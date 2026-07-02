import { delay, cloneDeep } from './utils';

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

const roomsSeed = [
  { id: '7c4a9e2f18b356d0', name: '책상', description: '책상' },
  { id: '3f91c6e52ad047b8', name: '침실', description: '침실' },
];

const devicesSeed = {
  input_devices: [
    {
      id: '8d2e5a1c49f7036b',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 레이더',
      description: 'SRS R4SN mmWave 레이더',
      enabled: true,
      class: 'srs_r4sn',
      interface: {
        host: '192.168.0.33',
        point_cloud: { enabled: true, port: 29172 },
        iq: { enabled: true, port: 29171 },
      },
      settings: {
        angle_z: 0.0,
        angle_y: 0.0,
        min_x: -5.0,
        max_x: 5.0,
        min_y: 0.0,
        max_y: 10.0,
        min_z: -2.0,
        max_z: 2.0,
      },
    },
    {
      id: '1a6f3e8d02c75491',
      room_id: '3f91c6e52ad047b8',
      name: '침실 마이크',
      description: 'ESP32 + INMP441, 16kHz 16bit mono',
      enabled: true,
      class: 'wave_mic',
      interface: { host: '192.168.0.50', port: 8765 },
      settings: { sample_rate: 16000, sample_size: 16, channels: 1 },
    },
    {
      id: '6b904f2e17d83ac5',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 카메라',
      description: 'USB Wave Camera',
      enabled: true,
      class: 'wave_cam',
      interface: { transport: 'usb', backend: 'v4l2', device: '/dev/video0' },
    },
    {
      id: 'c5281a7e93bf406d',
      room_id: '3f91c6e52ad047b8',
      name: '침실 카메라',
      description: 'Network Wave Camera',
      enabled: true,
      class: 'wave_cam',
      interface: { transport: 'tcp', backend: 'droidcam', host: '192.168.0.51', port: 4747 },
    },
    {
      id: '2e8d1795c0463f5a',
      room_id: '7c4a9e2f18b356d0',
      name: 'IR 수신기',
      description: 'LIRC IR 수신',
      enabled: true,
      class: 'ir_reciever',
      interface: { transport: 'lirc', device: '/dev/lirc0' },
    },
  ],
  output_devices: [
    {
      id: '9a4c71e36b0285fd',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 스마트 플러그',
      description: 'EP2H Tuya IoT 플러그',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.37',
        device_id: 'eb61aa6ce49add5d80yfcj',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '5e3b80a1f2496cde',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 TV',
      description: '삼성 32인치 TV',
      enabled: true,
      class: 'tizen_tv',
      interface: { host: '192.168.0.70', port: 8002, name: 'WaveHome-TV' },
    },
    {
      id: '0f8c2d6b147ae953',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 에어컨 IR',
      description: 'LIRC IR 송신, 에어컨 제어',
      enabled: true,
      class: 'ir_remote',
      interface: { transport: 'lirc', device: '/dev/lirc1', command_list: './ir/ac_commands.txt' },
    },
    {
      id: 'd7139e58a04b6c21',
      room_id: '3f91c6e52ad047b8',
      name: '침실 조명',
      description: 'Philips Hue 전구',
      enabled: true,
      class: 'hue_light',
      interface: { bridge_host: '192.168.0.80', username: 'hue-bridge-api-key-placeholder', light_id: 1 },
    },
    {
      id: '4b2a90e7c1586d3f',
      room_id: '3f91c6e52ad047b8',
      name: '침실 블라인드',
      description: 'Tuya 스마트 블라인드',
      enabled: false,
      class: 'tuya_blind',
      interface: {
        host: '192.168.0.61',
        device_id: 'bfabcdef12345678',
        local_key: 'f0e1d2c3b4a59687',
        version: '3.3',
      },
    },
  ],
};

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
let rooms = cloneDeep(roomsSeed);
let devices = cloneDeep(devicesSeed);
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

function getDeviceCollections() {
  return [devices.input_devices, devices.output_devices];
}

function findDevice(deviceId) {
  for (const collection of getDeviceCollections()) {
    const index = collection.findIndex((device) => device.id === deviceId);
    if (index !== -1) return { collection, index, device: collection[index] };
  }
  return null;
}

function ensureRoomExists(roomId) {
  if (!roomId) return;
  if (!rooms.some((room) => room.id === roomId)) {
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
    return cloneDeep(rooms);
  }

  async createRoom({ name, description = '' }) {
    await delay();
    const roomName = requireName(name, '방 이름을 입력해주세요.');
    const room = { id: makeHexId(), name: roomName, description: description.trim() || roomName };
    rooms = [...rooms, room];
    return cloneDeep(room);
  }

  async updateRoom(roomId, { name, description }) {
    await delay();
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw apiError(404, 'NOT_FOUND', '방을 찾을 수 없습니다.');
    if (name !== undefined) room.name = requireName(name, '방 이름을 입력해주세요.');
    if (description !== undefined) room.description = description.trim() || room.name;
    return cloneDeep(room);
  }

  async deleteRoom(roomId) {
    await delay();
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw apiError(404, 'NOT_FOUND', '방을 찾을 수 없습니다.');
    const hasDevices = [...devices.input_devices, ...devices.output_devices].some((device) => device.room_id === roomId);
    if (hasDevices) {
      throw apiError(409, 'ROOM_HAS_DEVICES', '이 방에 연결된 기기가 있어 삭제할 수 없습니다.');
    }
    rooms = rooms.filter((item) => item.id !== roomId);
    return { id: roomId };
  }

  async getDevices() {
    await delay();
    return cloneDeep(devices);
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
    devices[classifyDeviceBucket(device.class)] = [...devices[classifyDeviceBucket(device.class)], device];
    return cloneDeep(device);
  }

  async updateDevice(deviceId, payload) {
    await delay();
    const found = findDevice(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    if (payload.room_id !== undefined) ensureRoomExists(payload.room_id);

    const updated = mergeDefined({ ...found.device }, cloneDeep(payload));
    if (payload.name !== undefined) updated.name = requireName(payload.name, '기기 이름을 입력해주세요.');
    if (payload.description !== undefined) updated.description = payload.description.trim() || updated.name;

    const nextBucket = classifyDeviceBucket(updated.class);
    const currentBucket = devices.input_devices.includes(found.device) ? 'input_devices' : 'output_devices';
    if (nextBucket !== currentBucket) {
      found.collection.splice(found.index, 1);
      devices[nextBucket] = [...devices[nextBucket], updated];
    } else {
      found.collection[found.index] = updated;
    }

    return cloneDeep(updated);
  }

  async deleteDevice(deviceId) {
    await delay();
    const found = findDevice(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    found.collection.splice(found.index, 1);
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
