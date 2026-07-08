import { DAY_OF_WEEK_LABELS } from '../iot/iotUtils';

export { DAY_OF_WEEK_LABELS };

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// device.class → 알람 방법 그룹. 이 매핑에 없는 class는 알람 장치로 선택할 수 없다.
export const ALARM_METHOD_GROUP = {
  philips_wiz_e29_color: 'light',
  philips_wiz_e29_white: 'light',
  tuya_ep2h: 'plug',
  wave_station: 'tts',
  reolink_e1_pro: 'tts',
};

export function isAlarmEligibleDevice(device) {
  return Boolean(ALARM_METHOD_GROUP[device?.class]);
}

export function methodGroupFor(device) {
  return device ? ALARM_METHOD_GROUP[device.class] || null : null;
}

export function defaultMethodFor(group) {
  if (group === 'light') return { type: 'light_on', brightness: 80 };
  if (group === 'plug') return { type: 'plug_toggle' };
  if (group === 'tts') return { type: 'tts', speakerId: null, text: '', repeatCount: 3, intervalSec: 10 };
  return null;
}

// ── 12시간 시계 <-> 자정 기준 분(timeMinute) 변환 ──────────────────────────

export function formatClock12(timeMinute) {
  const h24 = Math.floor(timeMinute / 60) % 24;
  const minute = timeMinute % 60;
  const meridiem = h24 < 12 ? 'AM' : 'PM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, meridiem };
}

export function to24Hour(hour12, meridiem) {
  let h = hour12 % 12;
  if (meridiem === 'PM') h += 12;
  return h;
}

export function timeMinuteFrom(hour12, minute, meridiem) {
  return to24Hour(hour12, meridiem) * 60 + minute;
}

export function formatClockLabel(timeMinute) {
  const { hour12, minute, meridiem } = formatClock12(timeMinute);
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`;
}

// ── 다음 발동 시각 계산 ─────────────────────────────────────────────────────

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_LABEL_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * `alarm`의 다음 발동 Date를 반환한다. `daysOfWeek`가 비어 있으면(1회성) 현재 시각 기준
 * 가장 빠른 다음 시각(오늘 안 지났으면 오늘, 지났으면 내일)을 반환한다.
 * `enabled` 여부와 무관하게 계산만 한다 — 카드에 "활성화되면 울릴 날짜"를 보여주기 위함.
 */
export function computeNextFireDate(alarm, now = new Date()) {
  const hour = Math.floor(alarm.timeMinute / 60);
  const minute = alarm.timeMinute % 60;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

  const days = alarm.daysOfWeek || [];
  if (days.length === 0) {
    if (base.getTime() <= now.getTime()) base.setDate(base.getDate() + 1);
    return base;
  }

  const targetIndices = days.map((d) => DAY_INDEX[d]);
  for (let add = 0; add <= 7; add += 1) {
    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + add);
    if (!targetIndices.includes(candidate.getDay())) continue;
    if (add === 0 && candidate.getTime() <= now.getTime()) continue;
    return candidate;
  }
  return base;
}

export function formatNextFireLabel(date, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfTarget - startOfToday) / (24 * 60 * 60 * 1000));
  const dow = DAY_LABEL_KO[date.getDay()];
  if (diffDays === 0) return `오늘 (${dow})`;
  if (diffDays === 1) return `내일 (${dow})`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dow})`;
}

export function formatCountdownLabel(targetDate, now = new Date()) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return '곧 알람이 울립니다.';
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}분 후에 알람이 울립니다.`;
  return `${hours}시간 ${minutes}분 후에 알람이 울립니다.`;
}

export function sortAlarmsByTime(alarms) {
  return [...alarms].sort((a, b) => a.timeMinute - b.timeMinute);
}

// ── 알람 설정(draft) 검증 ───────────────────────────────────────────────────

export function validateAlarmDraft(draft) {
  if (!draft.name.trim()) return '알람 이름을 입력하세요.';
  if (!draft.deviceId) return '알람 장치를 선택하세요.';
  if (draft.smartWake && !draft.radarDeviceId) return '기상 맞춤 알람에 사용할 레이더를 선택하세요.';
  const method = draft.method;
  if (!method) return '알람 방법을 선택하세요.';
  if (method.type === 'tts') {
    if (!method.speakerId && method.speakerId !== 0) return 'TTS 목소리를 선택하세요.';
    if (!method.text || !method.text.trim()) return '재생할 문구를 입력하세요.';
  }
  return '';
}
