import { isDeviceOnline } from '../../utils/deviceSort';
import { deviceThumbnails } from '../../utils/deviceThumbnails';

export { deviceThumbnails };

/** API connectionStatus → CSS dot class (online | idle | offline | missing) */
export function deviceDotClass(device) {
  const status = device?.connectionStatus
    || (device?.connected ? 'online' : 'offline');
  if (status === 'online') return 'online';
  if (status === 'initializing') return 'idle';
  if (status === 'missing') return 'missing';
  return 'offline';
}

export function deviceDotTitle(device) {
  const status = device?.connectionStatus
    || (device?.connected ? 'online' : 'offline');
  if (status === 'online') return '온라인';
  if (status === 'initializing') return '초기화 중';
  if (status === 'missing') return '장치 없음';
  return '오프라인';
}

export function isDeviceOffline(device) {
  return !isDeviceOnline(device);
}

export { isDeviceOnline, sortDevicesForControl } from '../../utils/deviceSort';

export const EVENT_TYPE_LABELS = {
  connection: '연결',
  gesture: '제스처',
  execution: '실행',
  schedule: '예약',
  ir: '적외선',
};

export const EVENT_TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'connection', label: '연결' },
  { id: 'gesture', label: '제스처' },
  { id: 'ir', label: '적외선' },
  { id: 'execution', label: '실행' },
  { id: 'schedule', label: '예약' },
];

export const TRIGGER_KIND_LABELS = {
  gesture: '제스처',
  device_state: '장치 상태',
  ir_recv: '적외선 신호',
};

export function formatRelativeTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (date.toDateString() === now.toDateString()) {
    return `오늘 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}시간 전`;
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

export function formatTriggeredBy(triggeredBy, rules) {
  if (!triggeredBy) return '자동 감지';
  if (triggeredBy === 'manual') return '수동';
  const [kind, id] = triggeredBy.split(':');
  const rule = rules?.find((r) => r.id === id);
  if (kind === 'rule') return rule ? `자동 감지: ${rule.name}` : `자동 감지: ${id}`;
  if (kind === 'schedule') return rule ? `자동 예약: ${rule.name}` : `자동 예약: ${id}`;
  return triggeredBy;
}

// device.h Action::Attribute — maps to which execMode radio options a rule
// targeting this action may offer.
export function execModesFor(action) {
  const attrs = action?.attributes || [];
  const modes = ['once'];
  if (attrs.includes('Toggle')) modes.push('toggle');
  if (attrs.includes('Repeat')) modes.push('repeat');
  return modes;
}

export const EXEC_MODE_LABELS = { once: '한 번 실행', toggle: '켬·끔 전환', repeat: '반복 실행' };

export const SCHEDULE_REPEAT_LABELS = { once: '한 번만', daily: '매일', weekly: '매주' };

export const DAY_OF_WEEK_LABELS = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

export function describeSchedule(schedule) {
  if (!schedule) return null;
  if (schedule.repeat === 'once') return `${schedule.delayMinutes}분 뒤 1회`;
  if (schedule.repeat === 'daily') return `매일 ${schedule.time}`;
  if (schedule.repeat === 'weekly') {
    const days = (schedule.daysOfWeek || []).map((d) => DAY_OF_WEEK_LABELS[d] || d).join('·');
    return `매주 ${days} ${schedule.time}`;
  }
  return null;
}

export function describeTrigger(trigger, { deviceName, gestureClassName, commandName } = {}) {
  if (!trigger) return null;
  if (trigger.kind === 'gesture') return `${deviceName || trigger.deviceId} · ${gestureClassName || `클래스 ${trigger.classId}`}`;
  if (trigger.kind === 'device_state') return `${deviceName || trigger.deviceId} · ${trigger.query} ${trigger.op} ${trigger.value}`;
  if (trigger.kind === 'ir_recv') return `${deviceName || trigger.deviceId} · 적외선 신호 수신 (${commandName || trigger.commandId})`;
  return trigger.kind;
}
