import { delay, cloneDeep, nextNumericId } from './utils';
import { initialAlarms } from '../../data/alarmData';

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

let alarms = cloneDeep(initialAlarms);

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const VALID_METHOD_TYPES = ['light_blink', 'light_on', 'plug_toggle', 'plug_on', 'plug_off', 'tts'];

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function validationError(details) {
  throw apiError(400, 'VALIDATION_ERROR', '입력값을 확인해주세요.', { details });
}

// `partial` skips required-field checks for fields the PATCH body didn't touch,
// but still validates any field that IS present.
function validate(payload, { partial = false } = {}) {
  const details = [];

  if (('timeMinute' in payload) || !partial) {
    const t = payload.timeMinute;
    if (typeof t !== 'number' || t < 0 || t > 1439) {
      details.push({ field: 'timeMinute', code: 'INVALID_TIME', message: 'timeMinute은 0~1439 사이의 정수여야 합니다.' });
    }
  }

  if ('daysOfWeek' in payload && payload.daysOfWeek) {
    const bad = payload.daysOfWeek.some((d) => !VALID_DAYS.includes(d));
    if (bad) details.push({ field: 'daysOfWeek', code: 'INVALID_ENUM', message: 'daysOfWeek는 mon~sun 중 하나여야 합니다.' });
  }

  if ('method' in payload && payload.method) {
    if (!VALID_METHOD_TYPES.includes(payload.method.type)) {
      details.push({ field: 'method.type', code: 'INVALID_ENUM', message: '지원하지 않는 알람 방법입니다.' });
    }
  }

  const smartWake = 'smartWake' in payload ? payload.smartWake : undefined;
  if (smartWake && !payload.radarDeviceId) {
    details.push({ field: 'radarDeviceId', code: 'REQUIRED', message: '기상 맞춤 알람은 레이더를 선택해야 합니다.' });
  }

  if (details.length > 0) validationError(details);
}

export class AlarmApi {
  async getAlarms() {
    await delay();
    return cloneDeep(alarms).sort((a, b) => a.timeMinute - b.timeMinute);
  }

  async createAlarm(payload) {
    await delay();
    validate(payload);
    const stamp = nowStamp();
    const alarm = {
      id: nextNumericId(),
      name: (payload.name || '').trim() || '알람',
      timeMinute: payload.timeMinute,
      daysOfWeek: payload.daysOfWeek || [],
      repeatWeekly: typeof payload.repeatWeekly === 'boolean'
        ? payload.repeatWeekly
        : (payload.daysOfWeek || []).length > 0,
      smartWake: !!payload.smartWake,
      radarDeviceId: payload.smartWake ? payload.radarDeviceId || null : null,
      deviceId: payload.deviceId || null,
      method: payload.method || null,
      enabled: payload.enabled !== false,
      createdAt: stamp,
      updatedAt: stamp,
    };
    alarms.push(alarm);
    return cloneDeep(alarm);
  }

  async updateAlarm(id, payload) {
    await delay();
    const idx = alarms.findIndex((a) => a.id === id);
    if (idx === -1) throw apiError(404, 'NOT_FOUND', '알람을 찾을 수 없습니다.');
    validate(payload, { partial: true });

    const merged = { ...alarms[idx], ...payload, updatedAt: nowStamp() };
    if (payload.smartWake === false) merged.radarDeviceId = null;
    if ('name' in payload) merged.name = (payload.name || '').trim() || '알람';
    alarms[idx] = merged;
    return cloneDeep(merged);
  }

  async deleteAlarm(id) {
    await delay();
    const idx = alarms.findIndex((a) => a.id === id);
    if (idx === -1) throw apiError(404, 'NOT_FOUND', '알람을 찾을 수 없습니다.');
    alarms.splice(idx, 1);
    return { id };
  }
}
