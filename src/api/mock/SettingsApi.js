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
  ROOM_LIVING,
  ROOM_BEDROOM,
  hexId,
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

let nextAccountId = 3;
let nextRoomId = 4;
let nextDeviceId = 14;

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

// Synced with ko-KR (Supertonic 3) speaker presets from bin/models/tts/tts.json.
const ttsSpeakersSeed = [
  { id: 0, name: '미선', description: '차분하고 안정적인 중저음. 흔들림 없이 또렷하게 말하는 목소리', character: '침착하고 신뢰감 있는 성격으로, 안내와 설명에 어울림', gender: 'female' },
  { id: 1, name: '하은', description: '밝고 경쾌한 고음. 활기차고 발랄한 어조', character: '명랑하고 친근한 성격으로, 캐주얼한 안내와 홍보에 어울림', gender: 'female' },
  { id: 2, name: '서윤', description: '맑고 전문적인 아나운서 톤. 발음이 분명하고 전달력이 좋음', character: '단정하고 프로페셔널한 성격으로, 공지와 나레이션에 어울림', gender: 'female' },
  { id: 3, name: '유진', description: '또렷하고 자신감 있는 중음. 표현력 있고 힘 있는 말투', character: '당당하고 추진력 있는 성격으로, 발표와 안내 멘트에 어울림', gender: 'female' },
  { id: 4, name: '수아', description: '부드럽고 온화한 톤. 낮고 편안하게 다가오는 목소리', character: '다정하고 포근한 성격으로, 위로와 독백, 감성 콘텐츠에 어울림', gender: 'female' },
  { id: 5, name: '준호', description: '활기차고 긍정적인 중고음. 밝은 에너지가 느껴지는 목소리', character: '쾌활하고 자신감 있는 성격으로, 홍보와 일상 안내에 어울림', gender: 'male' },
  { id: 6, name: '민준', description: '깊고 묵직한 저음. 차분하고 진중한 어조', character: '신중하고 믿음직한 성격으로, 공식 안내와 다큐멘터리에 어울림', gender: 'male' },
  { id: 7, name: '성민', description: '권위 있고 단정한 톤. 또렷하고 신뢰감 있는 발화', character: '리더십 있고 책임감 있는 성격으로, 비즈니스 메시지에 어울림', gender: 'male' },
  { id: 8, name: '도현', description: '부드럽고 중성적인 중음. 친근하고 온화한 말투', character: '온순하고 다가가기 쉬운 성격으로, 교육 콘텐츠와 온보딩에 어울림', gender: 'male' },
  { id: 9, name: '현우', description: '따뜻하고 포근한 저중음. 이야기하듯 편안한 목소리', character: '차분하고 공감 능력이 있는 성격으로, 오디오북과 휴식 콘텐츠에 어울림', gender: 'male' },
];

// Randomly generated string that mimics a real API key format — for UI display only, not actual credentials.
function randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
}

const aiModelsSeed = [
  {
    id: 'gemma4-12b-mlx',
    vendor: 'google',
    name: 'gemma4-12b-mlx',
    provider: 'ollama',
    local: true,
    embedding: false,
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: null,
  },
  {
    id: 'gemini-flash2.5',
    vendor: 'google',
    name: 'gemini-flash2.5',
    provider: 'Google',
    local: false,
    embedding: false,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: `AIza${randomString(35, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')}`,
  },
  {
    id: 'gpt5.4-mini',
    vendor: 'openai',
    name: 'gpt5.4-mini',
    provider: 'OpenAI',
    local: false,
    embedding: false,
    endpoint: 'https://api.openai.com/v1',
    apiKey: `sk-proj-${randomString(48, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')}`,
  },
  {
    id: 'nomic-text-embed',
    vendor: 'nomic',
    name: 'nomic-text-embed',
    provider: 'ollama',
    local: true,
    embedding: true,
    endpoint: 'http://127.0.0.1:11434/v1',
    apiKey: null,
  },
];

const defaultAiAgentSettings = {
  personalPrompt: '',
  selectedModelId: 'gemini-flash2.5',
  ctrlEnterSend: false,
  waveAiSound: true,
};

// Chat-related toggles (ctrlEnterSend, waveAiSound, etc.) are persisted to
// localStorage so they survive a page refresh, unlike the rest of the mock state.
const AI_AGENT_SETTINGS_STORAGE_KEY = 'aiAgentSettings';

function loadPersistedAiAgentSettings() {
  try {
    const raw = localStorage.getItem(AI_AGENT_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistAiAgentSettings(settings) {
  try {
    localStorage.setItem(AI_AGENT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors (e.g. storage disabled)
  }
}

const accountsSeed = [
  { id: hexId(1), name: '김건강' },
  { id: hexId(2), name: '박웰빙' },
];

const defaultSleepConfig = {
  bedtime: '23:30',
  wakeTime: '07:00',
  goalHours: 7.5,
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
  theme: 'light',       // 'light' | 'dark' | 'system'
  language: 'ko',       // 'ko' | 'en'
  notificationSound: 'sign-of-the-times',
  ttsSpeakerId: 0,
  ttsPlaybackSpeed: 1.0, // 0.5 ~ 2.0
  browserPushEnabled: false,
};

const notificationsSeed = [
  {
    id: 1,
    type: 'timer',
    message: '착석 1시간 48분 경과 — 스트레칭을 해보세요',
    createdAt: '2026-07-02T07:10:00+09:00',
    read: false,
  },
  {
    id: 2,
    type: 'sleep',
    message: '오늘 수면 목표까지 30분 부족합니다',
    createdAt: '2026-07-02T07:12:00+09:00',
    read: false,
  },
  {
    id: 3,
    type: 'posture',
    message: '거북목 패턴 4회 감지됨',
    createdAt: '2026-07-02T14:35:00+09:00',
    read: true,
  },
  {
    id: 4,
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
let aiModels = cloneDeep(aiModelsSeed);
let aiAgentSettings = { ...cloneDeep(defaultAiAgentSettings), ...loadPersistedAiAgentSettings() };

// roomId -> array of member accountIds. Room membership is stored in-memory only.
let roomMembers = {
  [ROOM_LIVING]: [accountsSeed[0].id, accountsSeed[1].id],
  [ROOM_BEDROOM]: [accountsSeed[0].id],
};

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
  return ['srs_r4sn', 'wave_mic', 'wave_cam', 'ir_reciever', 'reolink_e1_pro', 'droid_cam'].includes(deviceClass)
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
  if (payload.goalHours != null && (payload.goalHours < 4 || payload.goalHours > 12)) {
    details.push({ field: 'goalHours', code: 'OUT_OF_RANGE', message: '수면 목표는 4~12시간 사이여야 합니다.' });
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
    const account = { id: hexId(nextAccountId++), name: requireName(name, '이름을 입력해주세요.') };
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
    const room = { id: hexId(nextRoomId++), name: roomName, description: description.trim() || roomName };
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
    // Dummy: removes from the in-memory rooms array only.
    removeRoom(roomId);
    delete roomMembers[roomId];
    return { id: roomId };
  }

  async getRoomMembers(roomId) {
    await delay();
    return [...(roomMembers[roomId] || [])];
  }

  // Dummy: room membership assignment is stored in-memory only.
  async updateRoomMembers(roomId, accountIds) {
    await delay();
    roomMembers[roomId] = [...accountIds];
    return [...roomMembers[roomId]];
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
      id: payload.id || hexId(nextDeviceId++),
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

    // Dummy: name/room/enabled changes are applied to the in-memory device list only.
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
    // Dummy: removes from the in-memory device list only.
    removeDeviceAt(found);
    return { id: deviceId };
  }

  // Dummy: device room assignment is changed in-memory only.
  async assignDeviceToRoom(deviceId, roomId) {
    await delay();
    const found = findDeviceEntry(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    ensureRoomExists(roomId);
    found.device.room_id = roomId;
    replaceDeviceAt(found, found.device);
    return cloneDeep(found.device);
  }

  async unassignDeviceFromRoom(deviceId) {
    await delay();
    const found = findDeviceEntry(deviceId);
    if (!found) throw apiError(404, 'NOT_FOUND', '기기를 찾을 수 없습니다.');
    found.device.room_id = null;
    replaceDeviceAt(found, found.device);
    return cloneDeep(found.device);
  }

  async getAiModels() {
    await delay();
    return cloneDeep(aiModels);
  }

  async getAiAgentSettings() {
    await delay();
    return cloneDeep(aiAgentSettings);
  }

  // Dummy: personal prompt, model selection, and chat settings are stored in-memory only.
  async updateAiAgentSettings({ personalPrompt, selectedModelId, ctrlEnterSend, waveAiSound }) {
    await delay();
    if (personalPrompt !== undefined) {
      if (personalPrompt.length > 10000) {
        throw apiError(400, 'PROMPT_TOO_LONG', '개인 프롬프트는 10000자 이하여야 합니다.', { field: 'personalPrompt' });
      }
      aiAgentSettings.personalPrompt = personalPrompt;
    }
    if (selectedModelId !== undefined) {
      if (!aiModels.some((model) => model.id === selectedModelId)) {
        throw apiError(404, 'NOT_FOUND', '모델을 찾을 수 없습니다.', { field: 'selectedModelId' });
      }
      aiAgentSettings.selectedModelId = selectedModelId;
    }
    if (ctrlEnterSend !== undefined) aiAgentSettings.ctrlEnterSend = Boolean(ctrlEnterSend);
    if (waveAiSound !== undefined) aiAgentSettings.waveAiSound = Boolean(waveAiSound);
    persistAiAgentSettings(aiAgentSettings);
    return cloneDeep(aiAgentSettings);
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
    // Dummy: theme/language are persisted but actual UI theme switching and i18n are not yet applied.
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
    return {
      items: cloneDeep(notifications),
      unreadCount: notifications.filter((n) => !n.read).length,
      hasMore: false,
    };
  }

  async markAllNotificationsRead() {
    await delay();
    notifications = notifications.map((notification) => ({ ...notification, read: true }));
    return {
      items: cloneDeep(notifications),
      unreadCount: 0,
      hasMore: false,
    };
  }

  async markNotificationRead(notificationId) {
    await delay();
    const id = Number(notificationId);
    notifications = notifications.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    ));
    const item = notifications.find((notification) => notification.id === id);
    if (!item) throw apiError(404, 'NOT_FOUND', '알림을 찾을 수 없습니다.');
    return cloneDeep(item);
  }
}
