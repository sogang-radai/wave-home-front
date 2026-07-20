import { describeTrigger, describeSchedule } from './iotUtils';
import { getClassInfo } from '../../api/mock/deviceClassRegistry';

export const DEVICE_STATE_OPS = ['>', '>=', '<', '<=', '=='];
export const SCHEDULE_REPEATS = ['once', 'daily', 'weekly'];
export const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// 마법사 1단계("무엇을 감지할까요?")의 선택지. 실제로 지원되는 trigger
// kind(gesture/device_state/ir_recv) + 예약(schedule)을 한 화면에 모은다 —
// 예전에는 "감지/예약" 모드 토글과 "감지 조건 종류" 드롭다운이 별개의
// 단계였는데, 사용자 입장에서는 결국 하나의 질문("언제 실행할까요?")이라
// 합쳤다.
export const TYPE_OPTIONS = [
  { mode: 'trigger', kind: 'gesture', label: '제스처 감지', desc: '레이더가 특정 동작을 인식하면 실행해요.' },
  { mode: 'trigger', kind: 'device_state', label: '기기 상태 감지', desc: '센서 값이 설정한 조건을 만족하면 실행해요.' },
  { mode: 'trigger', kind: 'ir_recv', label: '적외선 신호 감지', desc: '리모컨 등에서 신호를 받으면 실행해요.' },
  { mode: 'schedule', kind: null, label: '예약된 시각', desc: '정해진 시각 또는 반복 주기에 실행해요.' },
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
    if (!draft.trigger.deviceId) return '감지할 장치를 선택하세요.';
    if (draft.trigger.kind === 'gesture' && (draft.trigger.classId === null || draft.trigger.classId === undefined || draft.trigger.classId === '')) {
      return '제스처 클래스를 선택하세요.';
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
  if (!draft.action.deviceId) return '실행할 장치를 선택하세요.';
  if (!draft.action.name) return '실행할 동작을 선택하세요.';
  return '';
}

export function stepsFor(draft) {
  if (draft.mode === 'schedule') return ['type', 'schedule', 'actionDevice', 'action', 'execMode', 'name'];
  if (draft.mode === 'trigger') return ['type', 'device', 'detail', 'actionDevice', 'action', 'execMode', 'name'];
  return ['type'];
}

export const STEP_TITLES = {
  type: '무엇을 감지할까요?',
  device: '어떤 장치를 감지할까요?',
  detail: '세부 조건을 정해주세요',
  schedule: '언제 실행할까요?',
  actionDevice: '어떤 기기를 제어할까요?',
  action: '무엇을 할까요?',
  execMode: '실행 방식을 골라주세요',
  name: '이름을 지어주세요',
};

export function isStepValid(draft, stepId) {
  switch (stepId) {
    case 'type':
      return draft.mode === 'schedule' || (draft.mode === 'trigger' && !!draft.trigger?.kind);
    case 'device':
      return !!draft.trigger?.deviceId;
    case 'detail': {
      const t = draft.trigger;
      if (!t) return false;
      if (t.kind === 'gesture') return t.classId !== null && t.classId !== undefined && t.classId !== '';
      if (t.kind === 'device_state') return !!t.query;
      if (t.kind === 'ir_recv') return !!t.commandId;
      return false;
    }
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

export function suggestDraftName(draft, { triggerDeviceName, actionDeviceName, actionLabel } = {}) {
  const triggerPart = draft.mode === 'schedule'
    ? describeSchedule(draft.schedule)
    : describeTrigger(draft.trigger, { deviceName: triggerDeviceName });
  const actionPart = actionDeviceName && actionLabel ? `${actionDeviceName} ${actionLabel}` : '';
  return [triggerPart, actionPart].filter(Boolean).join(' · ');
}
