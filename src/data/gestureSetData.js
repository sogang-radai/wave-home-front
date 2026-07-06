// Mirrors bin/gestures/gesture_sets.json + bin/gestures/desk_set/set.json.
// Kept as a hardcoded JS mirror (not a direct import) because CRA's
// ModuleScopePlugin forbids importing files outside of src/ — same pattern
// used by devicesStore.js for bin/device/device_list.json.
import t0 from '../img/gesture/desk_set/7-0.png';
import t1 from '../img/gesture/desk_set/7-1.png';
import t2 from '../img/gesture/desk_set/7-2.png';
import t3 from '../img/gesture/desk_set/7-3.png';
import t4 from '../img/gesture/desk_set/7-4.png';
import t5 from '../img/gesture/desk_set/7-5.png';
import t6 from '../img/gesture/desk_set/7-6.png';
import t7 from '../img/gesture/desk_set/7-7.png';
import t8 from '../img/gesture/desk_set/7-8.png';
import t9 from '../img/gesture/desk_set/7-9.png';
import t10 from '../img/gesture/desk_set/7-10.png';
import t11 from '../img/gesture/desk_set/7-11.png';

// gesture_sets.json — registry of available sets. Only desk_set has a real
// set.json today; bed_set is registered but not authored yet (empty classes).
export const gestureSetRegistry = [
  { id: 'desk_set', name: 'Desk Set', path: 'gestures/desk_set/set.json', enabled: true },
  { id: 'bed_set', name: 'Bed Set', path: 'gestures/bed_set/set.json', enabled: false },
];

// desk_set/set.json — 'kind' classifies each class as a sustained state
// (부재중/앉음/엎드림 — long hold + long cooldown, describes posture) vs. a
// momentary trigger (스와이프/반짝 등 — short hold + short cooldown, usable
// as an automation trigger). Only 'trigger' classes can be wired to rules.
export const gestureSetDefinitions = {
  desk_set: {
    name: '데스크 제스처 세트',
    description: '레이더 센서 기반 상시 모니터링 데스크 제스처 세트입니다.',
    modelPath: 'model/model.json',
    classes: [
      { classId: 0, name: '부재중', thumbnail: t0, kind: 'state',
        trigger: { highThreshold: 0.85, lowThreshold: 0.15, highHoldMs: 600, lowHoldMs: 500, cooldownMs: 3000 } },
      { classId: 1, name: '앉음', thumbnail: t1, kind: 'state',
        trigger: { highThreshold: 0.80, lowThreshold: 0.20, highHoldMs: 500, lowHoldMs: 500, cooldownMs: 3000 } },
      { classId: 2, name: '엎드림', thumbnail: t2, kind: 'state',
        trigger: { highThreshold: 0.80, lowThreshold: 0.20, highHoldMs: 500, lowHoldMs: 500, cooldownMs: 3000 } },
      { classId: 3, name: '손 앞으로 구르기', thumbnail: t3, kind: 'trigger',
        trigger: { highThreshold: 0.70, lowThreshold: 0.35, highHoldMs: 200, lowHoldMs: 150, cooldownMs: 1000 } },
      { classId: 4, name: '손 뒤로 구르기', thumbnail: t4, kind: 'trigger',
        trigger: { highThreshold: 0.70, lowThreshold: 0.35, highHoldMs: 200, lowHoldMs: 150, cooldownMs: 1000 } },
      { classId: 5, name: '왼쪽 스와이프', thumbnail: t5, kind: 'trigger',
        trigger: { highThreshold: 0.92, lowThreshold: 0.25, highHoldMs: 50, lowHoldMs: 50, cooldownMs: 800 } },
      { classId: 6, name: '오른쪽 스와이프', thumbnail: t6, kind: 'trigger',
        trigger: { highThreshold: 0.92, lowThreshold: 0.25, highHoldMs: 50, lowHoldMs: 50, cooldownMs: 800 } },
      { classId: 7, name: '오른손 반짝', thumbnail: t7, kind: 'trigger',
        trigger: { highThreshold: 0.65, lowThreshold: 0.40, highHoldMs: 150, lowHoldMs: 120, cooldownMs: 1200 } },
      { classId: 8, name: '왼손 반짝', thumbnail: t8, kind: 'trigger',
        trigger: { highThreshold: 0.65, lowThreshold: 0.40, highHoldMs: 150, lowHoldMs: 120, cooldownMs: 1200 } },
      { classId: 9, name: '양손 반짝', thumbnail: t9, kind: 'trigger',
        trigger: { highThreshold: 0.70, lowThreshold: 0.40, highHoldMs: 150, lowHoldMs: 120, cooldownMs: 1200 } },
      { classId: 10, name: '오른손 시계방향', thumbnail: t10, kind: 'trigger',
        trigger: { highThreshold: 0.9, lowThreshold: 0.35, highHoldMs: 300, lowHoldMs: 100, cooldownMs: 500 } },
      { classId: 11, name: '왼손 반시계방향', thumbnail: t11, kind: 'trigger',
        trigger: { highThreshold: 0.9, lowThreshold: 0.35, highHoldMs: 300, lowHoldMs: 100, cooldownMs: 500 } },
    ],
  },
  bed_set: {
    name: '베드 제스처 세트',
    description: '아직 정의된 제스처 클래스가 없습니다.',
    modelPath: null,
    classes: [],
  },
};
