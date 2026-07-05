export const gestureHistory = [
  { id: 1, gesture: '손 올리기', device: '거실 조명', action: '전원 켜기', time: '방금 전', confidence: 96, radar: '거실 레이더' },
  { id: 2, gesture: '오른쪽 스와이프', device: '침실 에어컨', action: '온도 1℃ 낮춤', time: '8분 전', confidence: 91, radar: '거실 레이더' },
  { id: 3, gesture: '주먹 쥐기', device: '서재 스피커', action: '일시정지', time: '23분 전', confidence: 88, radar: '거실 레이더' },
  { id: 4, gesture: '왼쪽 스와이프', device: '거실 커튼', action: '닫기', time: '오늘 09:12', confidence: 94, radar: '거실 레이더' },
];

export const gestureSets = [
  {
    id: 'daily',
    name: 'Daily Control',
    description: '조명, 커튼, 스피커처럼 자주 쓰는 가전을 빠르게 제어합니다.',
    gestures: [
      { id: 1, name: '손 올리기', action: '조명 켜기', radars: ['8d2e5a1c49f7036b'] },
      { id: 2, name: '손 내리기', action: '조명 끄기', radars: ['8d2e5a1c49f7036b'] },
      { id: 3, name: '왼쪽 스와이프', action: '커튼 닫기', radars: [] },
      { id: 4, name: '오른쪽 스와이프', action: '커튼 열기', radars: [] },
      { id: 5, name: '주먹 쥐기', action: '미디어 일시정지', radars: ['8d2e5a1c49f7036b'] },
    ],
  },
  {
    id: 'sleep',
    name: '수면 모드',
    description: '취침 전 조명, 온도, 소리를 한 번에 낮추는 루틴 세트입니다.',
    gestures: [
      { id: 6, name: '손바닥 보이기', action: '수면 모드 시작', radars: ['8d2e5a1c49f7036b'] },
      { id: 7, name: '원 그리기', action: '무드등 20%', radars: [] },
      { id: 8, name: '두 번 탭', action: '백색소음 재생', radars: [] },
      { id: 9, name: '아래 스와이프', action: '에어컨 24℃', radars: [] },
    ],
  },
  {
    id: 'focus',
    name: '집중 모드',
    description: '책상 앞에서 방해 요소를 줄이고 조명과 소리를 집중 환경으로 맞춥니다.',
    gestures: [
      { id: 10, name: '두 손 모으기', action: '집중 조명 켜기', radars: ['8d2e5a1c49f7036b'] },
      { id: 11, name: '앞으로 밀기', action: '스피커 볼륨 낮춤', radars: [] },
      { id: 12, name: '손바닥 가리기', action: '알림 음소거', radars: [] },
      { id: 13, name: '위로 스와이프', action: '공기청정기 강풍', radars: [] },
    ],
  },
  {
    id: 'rest',
    name: '휴식 모드',
    description: '휴식 시간에 맞춰 조명은 부드럽게, 음악과 온도는 편안하게 조절합니다.',
    gestures: [
      { id: 14, name: '손 흔들기', action: '휴식 음악 재생', radars: [] },
      { id: 15, name: '손바닥 위로', action: '무드등 밝게', radars: [] },
      { id: 16, name: '손바닥 아래로', action: '무드등 낮춤', radars: [] },
      { id: 17, name: '원 크게 그리기', action: '커튼 반쯤 열기', radars: [] },
    ],
  },
];

export const iotDevices = [
  {
    id: 'light',
    name: '거실 조명',
    room: '거실',
    state: '켜짐 · 밝기 72%',
    connection: 'online',
    controls: [
      { label: '전원', binding: '손 올리기 / 손 내리기' },
      { label: '밝기 조절', binding: '위아래 스와이프' },
      { label: '무드등', binding: '원 그리기' },
    ],
  },
  {
    id: 'ac',
    name: '침실 에어컨',
    room: '침실',
    state: '24℃ · 자동',
    connection: 'online',
    controls: [
      { label: '전원', binding: '손바닥 보이기' },
      { label: '온도 낮춤', binding: '오른쪽 스와이프' },
      { label: '수면풍', binding: '아래 스와이프' },
    ],
  },
  {
    id: 'speaker',
    name: '서재 스피커',
    room: '서재',
    state: '대기 중',
    connection: 'idle',
    controls: [
      { label: '재생/정지', binding: '주먹 쥐기' },
      { label: '다음 트랙', binding: '오른쪽 스와이프' },
      { label: '볼륨 낮춤', binding: '손 내리기' },
    ],
  },
];

// ── Power page mock trend generators ────────────────────────────────────────
// Deterministic (seeded) pseudo-random generators so charts stay stable across
// re-renders for the same plug/range, without needing to store huge static arrays.

const COMBO_RANGE_CONFIG = {
  min1: { points: 60, stepSeconds: 1 },
  min10: { points: 60, stepSeconds: 10 },
  min30: { points: 60, stepSeconds: 30 },
  hour: { points: 60, stepSeconds: 60 },
};

export function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h || 1;
}

export function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function formatAgoLabel(secondsAgo) {
  if (secondsAgo === 0) return '지금';
  if (secondsAgo < 60) return `-${secondsAgo}s`;
  return `-${Math.round(secondsAgo / 60)}분`;
}

// Combo ranges (1분/10분/30분/1시간): W line + Wh-per-sample bar, same series.
export function generatePowerComboTrend(range, baseW, plugId = 'plug') {
  const cfg = COMBO_RANGE_CONFIG[range] || COMBO_RANGE_CONFIG.min1;
  const rand = seededRandom(hashSeed(`${plugId}:${range}`));
  const data = [];
  for (let i = 0; i < cfg.points; i++) {
    const noise = (rand() - 0.5) * baseW * 0.18;
    const wave = Math.sin(i / 6) * baseW * 0.08;
    const value = Math.max(0, +(baseW + noise + wave).toFixed(1));
    const secondsAgo = (cfg.points - 1 - i) * cfg.stepSeconds;
    data.push({
      label: formatAgoLabel(secondsAgo),
      value,
      wh: +(value * (cfg.stepSeconds / 3600)).toFixed(4),
    });
  }
  return data;
}

// Period ranges (일간/주간/월간/연간): Wh bars only.
export function generatePowerPeriodTrend(range, baseW, plugId = 'plug') {
  const rand = seededRandom(hashSeed(`${plugId}:${range}:period`));
  const dailyWh = baseW * 24; // Wh consumed in a full day if run continuously at baseW
  if (range === 'day') {
    // Hour-of-day usage curve peaking in the evening, in Wh-per-hour (~baseW average)
    return Array.from({ length: 24 }, (_, h) => {
      const factor = 0.55 + 0.45 * Math.sin(((h - 6) / 24) * Math.PI * 2 - Math.PI / 2);
      return { label: `${h}시`, wh: Math.max(0.1, +(baseW * factor * (0.85 + rand() * 0.3)).toFixed(2)) };
    });
  }
  if (range === 'week') {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    return days.map((d) => ({ label: d, wh: +(dailyWh * (0.8 + rand() * 0.4)).toFixed(1) }));
  }
  if (range === 'month') {
    const now = new Date();
    const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: dayCount }, (_, i) => ({
      label: `${i + 1}`,
      wh: +(dailyWh * (0.75 + rand() * 0.5)).toFixed(1),
    }));
  }
  // year — monthly totals in kWh
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return months.map((m) => ({ label: m, wh: +((dailyWh * 30 * (0.7 + rand() * 0.5)) / 1000).toFixed(1), unitKwh: true }));
}

export const powerRanges = [
  { id: 'hour', label: '시간' },
  { id: 'day', label: '일간' },
  { id: 'week', label: '주간' },
  { id: 'month', label: '월간' },
];

export const smartPlugDevices = [
  {
    id: 'all',
    name: '전체',
    room: '전체 콘센트',
    summary: '대기 전력이 낮고 TV 콘센트만 짧게 상승했습니다.',
    power_w: 67.4,
    voltage_v: 235.0,
    current_ma: 286.7,
    switch: true,
    hourlyCost: 7.4,
    trend: {
      hour: [
        { label: '00:00', value: 42 },
        { label: '04:00', value: 35 },
        { label: '08:00', value: 58 },
        { label: '12:00', value: 64 },
        { label: '16:00', value: 78 },
        { label: '20:00', value: 67 },
      ],
      day: [
        { label: '월', value: 1.4 },
        { label: '화', value: 1.7 },
        { label: '수', value: 1.5 },
        { label: '목', value: 1.8 },
        { label: '금', value: 2.2 },
        { label: '토', value: 2.5 },
        { label: '일', value: 2.1 },
      ],
      week: [
        { label: '1주', value: 13.2 },
        { label: '2주', value: 14.1 },
        { label: '3주', value: 12.8 },
        { label: '4주', value: 15.4 },
      ],
      month: [
        { label: '3월', value: 46 },
        { label: '4월', value: 51 },
        { label: '5월', value: 49 },
        { label: '6월', value: 55 },
      ],
    },
  },
  {
    id: 'plug-tv',
    name: '거실 TV 플러그',
    room: '거실',
    summary: '저녁 시간대 사용량이 몰립니다. 절전 모드 예약이 효과적입니다.',
    power_w: 23.7,
    voltage_v: 235.1,
    current_ma: 100.0,
    switch: true,
    hourlyCost: 2.6,
    trend: {
      hour: [
        { label: '00:00', value: 1.8 },
        { label: '04:00', value: 1.5 },
        { label: '08:00', value: 4.2 },
        { label: '12:00', value: 12.6 },
        { label: '16:00', value: 18.4 },
        { label: '20:00', value: 23.7 },
      ],
      day: [
        { label: '월', value: 0.32 },
        { label: '화', value: 0.41 },
        { label: '수', value: 0.38 },
        { label: '목', value: 0.45 },
        { label: '금', value: 0.62 },
        { label: '토', value: 0.77 },
        { label: '일', value: 0.58 },
      ],
      week: [
        { label: '1주', value: 3.1 },
        { label: '2주', value: 3.6 },
        { label: '3주', value: 3.0 },
        { label: '4주', value: 4.2 },
      ],
      month: [
        { label: '3월', value: 11 },
        { label: '4월', value: 13 },
        { label: '5월', value: 12 },
        { label: '6월', value: 15 },
      ],
    },
  },
  {
    id: 'plug-desk',
    name: '책상 멀티탭',
    room: '책상',
    summary: '업무 시간에 안정적인 부하가 유지됩니다.',
    power_w: 31.8,
    voltage_v: 234.8,
    current_ma: 135.4,
    switch: true,
    hourlyCost: 3.5,
    trend: {
      hour: [
        { label: '00:00', value: 8 },
        { label: '04:00', value: 7 },
        { label: '08:00', value: 26 },
        { label: '12:00', value: 34 },
        { label: '16:00', value: 39 },
        { label: '20:00', value: 32 },
      ],
      day: [
        { label: '월', value: 0.78 },
        { label: '화', value: 0.86 },
        { label: '수', value: 0.81 },
        { label: '목', value: 0.89 },
        { label: '금', value: 0.94 },
        { label: '토', value: 0.45 },
        { label: '일', value: 0.42 },
      ],
      week: [
        { label: '1주', value: 4.8 },
        { label: '2주', value: 5.1 },
        { label: '3주', value: 4.6 },
        { label: '4주', value: 5.4 },
      ],
      month: [
        { label: '3월', value: 17 },
        { label: '4월', value: 18 },
        { label: '5월', value: 17 },
        { label: '6월', value: 19 },
      ],
    },
  },
  {
    id: 'plug-light',
    name: '침실 조명 플러그',
    room: '침실',
    summary: '수면 루틴 이후 대기 전력만 남습니다.',
    power_w: 11.9,
    voltage_v: 235.2,
    current_ma: 51.3,
    switch: true,
    hourlyCost: 1.3,
    trend: {
      hour: [
        { label: '00:00', value: 12 },
        { label: '04:00', value: 2 },
        { label: '08:00', value: 4 },
        { label: '12:00', value: 6 },
        { label: '16:00', value: 7 },
        { label: '20:00', value: 12 },
      ],
      day: [
        { label: '월', value: 0.30 },
        { label: '화', value: 0.29 },
        { label: '수', value: 0.31 },
        { label: '목', value: 0.33 },
        { label: '금', value: 0.35 },
        { label: '토', value: 0.38 },
        { label: '일', value: 0.34 },
      ],
      week: [
        { label: '1주', value: 2.1 },
        { label: '2주', value: 2.2 },
        { label: '3주', value: 2.0 },
        { label: '4주', value: 2.3 },
      ],
      month: [
        { label: '3월', value: 7 },
        { label: '4월', value: 8 },
        { label: '5월', value: 8 },
        { label: '6월', value: 9 },
      ],
    },
  },
];
