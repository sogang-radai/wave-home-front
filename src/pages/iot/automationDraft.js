import { describeTrigger, describeSchedule } from './iotUtils';
import { getClassInfo } from '../../api/mock/deviceClassRegistry';

export const DEVICE_STATE_OPS = ['>', '>=', '<', '<=', '=='];
export const SCHEDULE_REPEATS = ['once', 'daily', 'weekly'];
export const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// 자동화(+ 새 자동화) 1단계 — 예약은 별도 진입이라 여기선 제외.
export const TYPE_OPTIONS = [
  { mode: 'trigger', kind: 'gesture', label: '제스처 감지', desc: '레이더가 특정 제스처를 인식하면 실행해요.' },
  { mode: 'trigger', kind: 'device_state', label: '기기 상태 감지', desc: '센서의 값이 설정한 조건을 만족하면 실행해요.' },
  { mode: 'trigger', kind: 'ir_recv', label: '적외선 신호 감지', desc: '리모컨에서 적외선 신호를 받으면 실행해요.' },
];

export function emptyDraft() {
  return {
    mode: '',
    name: '',
    enabled: true,
    trigger: null,
    schedule: null,
    action: { deviceId: '', name: '', params: {} },
    execMode: 'once',
    repeatIntervalMs: 200,
    cooldownMs: 1000,
  };
}

export function draftFromRule(rule) {
  return {
    mode: rule.schedule ? 'schedule' : 'trigger',
    name: rule.name,
    enabled: rule.enabled,
    trigger: rule.trigger,
    schedule: rule.schedule,
    action: rule.action,
    execMode: rule.execMode,
    repeatIntervalMs: rule.repeatIntervalMs ?? 200,
    cooldownMs: rule.cooldownMs ?? 0,
  };
}

export function devicesWithTriggerKind(devices, kind) {
  return devices.filter((d) => (getClassInfo(d.class).triggerKinds || []).includes(kind));
}

export function devicesWithActions(devices) {
  return devices.filter((d) => (getClassInfo(d.class).actions || []).length > 0);
}

export function validateDraft(draft) {
  if (!draft.name.trim()) return '이름을 입력하세요.';
  if (draft.mode === 'trigger') {
    if (!draft.trigger?.kind) return '감지 조건 종류를 선택하세요.';
    if (!draft.trigger.deviceId) return '감지할 기기를 선택하세요.';
    if (draft.trigger.kind === 'gesture' && (draft.trigger.classId === null || draft.trigger.classId === undefined || draft.trigger.classId === '')) {
      return '제스처를 선택하세요.';
    }
    if (draft.trigger.kind === 'device_state' && !draft.trigger.query) return '측정값을 선택하세요.';
    if (draft.trigger.kind === 'ir_recv' && !draft.trigger.commandId) return '수신 커맨드를 선택하세요.';
  } else if (draft.mode === 'schedule') {
    if (!draft.schedule?.repeat) return '예약 주기를 선택하세요.';
    if (draft.schedule.repeat === 'once' && !draft.schedule.delayMinutes) return '몇 분 후 실행할지 입력하세요.';
    if ((draft.schedule.repeat === 'daily' || draft.schedule.repeat === 'weekly') && !draft.schedule.time) return '실행 시각을 입력하세요.';
    if (draft.schedule.repeat === 'weekly' && !(draft.schedule.daysOfWeek || []).length) return '요일을 하나 이상 선택하세요.';
  } else {
    return '무엇을 감지할지 선택하세요.';
  }
  if (!draft.action.deviceId) return '실행할 기기를 선택하세요.';
  if (!draft.action.name) return '실행할 동작을 선택하세요.';
  return '';
}

export function stepsFor(draft) {
  if (draft.mode === 'schedule') {
    return ['schedule', 'actionDevice', 'action', 'execMode', 'name'];
  }
  if (draft.mode === 'trigger') {
    const kind = draft.trigger?.kind;
    if (kind === 'gesture') {
      return ['type', 'gesture', 'actionDevice', 'action', 'execMode', 'name'];
    }
    if (kind === 'device_state') {
      return ['type', 'device', 'detail', 'actionDevice', 'action', 'execMode', 'name'];
    }
    if (kind === 'ir_recv') {
      return ['type', 'irDetect', 'actionDevice', 'action', 'execMode', 'name'];
    }
    return ['type'];
  }
  return ['type'];
}

export const STEP_TITLES = {
  type: '무엇을 감지할까요?',
  gesture: '어떤 레이더로 제스처를 감지할까요?',
  device: '어떤 기기의 상태를 감지할까요?',
  detail: '세부 조건을 정해주세요',
  irDetect: '어떤 기기로 적외선 신호를 감지할까요?',
  schedule: '언제 실행할까요?',
  actionDevice: '어떤 가전을 제어할까요?',
  action: '어떻게 제어할까요?',
  execMode: '실행 방식을 골라주세요',
  name: '이름을 지어주세요',
};

export function isStepValid(draft, stepId) {
  switch (stepId) {
    case 'type':
      return draft.mode === 'schedule' || (draft.mode === 'trigger' && !!draft.trigger?.kind);
    case 'gesture':
      return !!draft.trigger?.deviceId
        && !!draft.trigger?.gestureSetPath
        && draft.trigger.classId !== null
        && draft.trigger.classId !== undefined
        && draft.trigger.classId !== '';
    case 'device':
      return !!draft.trigger?.deviceId;
    case 'detail': {
      const t = draft.trigger;
      if (!t) return false;
      if (t.kind === 'device_state') return !!t.query;
      return false;
    }
    case 'irDetect':
      return !!draft.trigger?.deviceId && !!draft.trigger?.commandId;
    case 'schedule': {
      const s = draft.schedule;
      if (!s?.repeat) return false;
      if (s.repeat === 'once') return !!s.delayMinutes && s.delayMinutes > 0;
      if (s.repeat === 'daily') return !!s.time;
      if (s.repeat === 'weekly') return !!s.time && (s.daysOfWeek || []).length > 0;
      return false;
    }
    case 'actionDevice':
      return !!draft.action.deviceId;
    case 'action':
      return !!draft.action.name;
    case 'execMode':
      return true;
    case 'name':
      return draft.name.trim().length > 0;
    default:
      return false;
  }
}

/** Steps where picking one item can advance immediately. */
export function canAutoAdvance(stepId, draft, extra = {}) {
  if (stepId === 'type') return true;
  if (stepId === 'actionDevice') return true;
  if (stepId === 'device') return true;
  if (stepId === 'gesture' && extra.picked === 'gesture') return isStepValid(draft, 'gesture');
  if (stepId === 'irDetect' && extra.picked === 'command') return isStepValid(draft, 'irDetect');
  if (stepId === 'action' && extra.hasParams === false) return !!draft.action.name;
  return false;
}

export function suggestDraftName(draft, { triggerDeviceName, actionDeviceName, actionLabel } = {}) {
  const triggerPart = draft.mode === 'schedule'
    ? describeSchedule(draft.schedule)
    : describeTrigger(draft.trigger, { deviceName: triggerDeviceName });
  const actionPart = actionDeviceName && actionLabel ? `${actionDeviceName} ${actionLabel}` : '';
  return [triggerPart, actionPart].filter(Boolean).join(' · ');
}

export function timeStringToMinutes(time) {
  const [h, m] = String(time || '00:00').split(':').map((n) => Number(n) || 0);
  return (h * 60) + m;
}

export function minutesToTimeString(totalMinutes) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
