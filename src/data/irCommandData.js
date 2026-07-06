// Mirrors bin/device/ir_list.json — see devicesStore.js header comment for
// why this is a hardcoded JS mirror rather than a direct import.
export const irCommandSeed = [
  {
    id: 1,
    name: '에어컨 전원',
    description: 'LG 에어컨 전원 토글 (학습됨)',
    deviceHint: 'LG 에어컨',
    unit: 'us',
    timings: [9000, 4500, 560, 560, 560, 1690, 560, 560, 560, 1690, 560, 560, 560, 1690, 560, 39000],
    source: 'learned',
    createdAt: '2026-07-01T10:00:00+09:00',
  },
  {
    id: 2,
    name: '에어컨 온도 올리기',
    description: 'LG 에어컨 온도 +1',
    deviceHint: 'LG 에어컨',
    unit: 'us',
    timings: [9000, 4500, 560, 1690, 560, 560, 560, 1690, 560, 560, 560, 560, 560, 1690, 560, 39000],
    source: 'learned',
    createdAt: '2026-07-01T10:02:00+09:00',
  },
  {
    id: 3,
    name: '에어컨 온도 내리기',
    description: 'LG 에어컨 온도 -1',
    deviceHint: 'LG 에어컨',
    unit: 'us',
    timings: [9000, 4500, 560, 560, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 1690, 560, 39000],
    source: 'learned',
    createdAt: '2026-07-01T10:03:00+09:00',
  },
  {
    id: 4,
    name: 'TV 전원',
    description: '삼성 TV 전원 토글',
    deviceHint: '삼성 TV',
    unit: 'us',
    timings: [4500, 4500, 560, 560, 560, 560, 560, 1690, 560, 44000],
    source: 'manual',
    createdAt: '2026-07-02T09:00:00+09:00',
  },
  {
    id: 5,
    name: 'TV 볼륨 올리기',
    description: '수동 입력',
    deviceHint: '삼성 TV',
    unit: 'us',
    timings: [4500, 4500, 560, 560, 560, 560, 560, 1690, 560, 44000],
    source: 'manual',
    createdAt: '2026-07-02T09:01:00+09:00',
  },
  {
    id: 6,
    name: 'TV 볼륨 내리기',
    description: '수동 입력',
    deviceHint: '삼성 TV',
    unit: 'us',
    timings: [4500, 4500, 560, 1690, 560, 560, 560, 560, 560, 44000],
    source: 'manual',
    createdAt: '2026-07-02T09:02:00+09:00',
  },
  {
    id: 7,
    name: 'TV 채널 올리기',
    description: '수동 입력',
    deviceHint: '삼성 TV',
    unit: 'us',
    timings: [4500, 4500, 560, 1690, 560, 1690, 560, 560, 560, 44000],
    source: 'manual',
    createdAt: '2026-07-02T09:03:00+09:00',
  },
  {
    id: 8,
    name: 'TV 채널 내리기',
    description: '수동 입력',
    deviceHint: '삼성 TV',
    unit: 'us',
    timings: [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 44000],
    source: 'manual',
    createdAt: '2026-07-02T09:04:00+09:00',
  },
];

export function validateTimings(timings) {
  if (!Array.isArray(timings) || timings.length === 0) return '타이밍 배열이 비어 있습니다.';
  if (timings.length % 2 !== 0) return '타이밍 개수는 짝수여야 합니다(mark/space 쌍).';
  if (timings.length < 4) return '타이밍이 너무 짧습니다(최소 4개).';
  if (timings.length > 400) return '타이밍이 너무 깁니다(최대 400개).';
  if (timings.some((value) => !Number.isFinite(value) || value <= 0 || !Number.isInteger(value))) {
    return '모든 값은 양의 정수(마이크로초)여야 합니다.';
  }
  return null;
}

export function parseTimingsText(text) {
  const parts = text.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
  const timings = parts.map((part) => Number(part));
  if (timings.some((value) => Number.isNaN(value))) return { timings: null, error: '숫자가 아닌 값이 포함되어 있습니다.' };
  return { timings, error: validateTimings(timings) };
}
