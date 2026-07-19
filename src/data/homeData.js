import { withInsightIds } from '../components/report/InsightCard';
import { getNow } from '../lib/demoClock';

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

// Dashboard sparkline: ~10 minutes of 10-second samples (60 points).
export function generatePowerTenSecTrend(baseW, plugId = 'all', points = 60) {
  const rand = seededRandom(hashSeed(`${plugId}:tenSec`));
  const data = [];
  for (let i = 0; i < points; i++) {
    const noise = (rand() - 0.5) * baseW * 0.12;
    const value = Math.max(0, +(baseW + noise).toFixed(1));
    const secondsAgo = (points - 1 - i) * 10;
    data.push({ label: formatAgoLabel(secondsAgo), value });
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
    // 롤링 7일(앵커 기준) — 백엔드 period_trend 와 동일하게 periodStart 를 붙인다.
    const end = getNow();
    end.setHours(0, 0, 0, 0);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(end);
      day.setDate(end.getDate() - (6 - i));
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, '0');
      const d = String(day.getDate()).padStart(2, '0');
      return {
        label: weekdays[day.getDay()],
        wh: +(dailyWh * (0.8 + rand() * 0.4)).toFixed(1),
        periodStart: `${y}-${m}-${d}`,
      };
    });
  }
  if (range === 'month') {
    const now = getNow();
    const y = now.getFullYear();
    const month = now.getMonth();
    const dayCount = new Date(y, month + 1, 0).getDate();
    return Array.from({ length: dayCount }, (_, i) => {
      const dayNum = i + 1;
      const m = String(month + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      return {
        label: `${dayNum}`,
        wh: +(dailyWh * (0.75 + rand() * 0.5)).toFixed(1),
        periodStart: `${y}-${m}-${d}`,
      };
    });
  }
  // year — monthly totals in kWh
  const year = getNow().getFullYear();
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return months.map((m, idx) => ({
    label: m,
    wh: +((dailyWh * 30 * (0.7 + rand() * 0.5)) / 1000).toFixed(1),
    unitKwh: true,
    periodStart: `${year}-${String(idx + 1).padStart(2, '0')}-01`,
  }));
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
      tenSec: generatePowerTenSecTrend(67.4),
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

// insight (surface='power') mock seed — mirrors sleepData.js/postureData.js's
// withInsightIds([label, title, text]) shape; registered in insightsStore.js.
export const powerInsights = withInsightIds([
  ['대기전력 절감', '거실 TV 플러그 대기 예약 22:00~06:00 추가', '심야 시간대 대기전력이 꾸준히 감지돼요. 사용하지 않는 시간대에 자동으로 전원을 끄면 월 사용량을 줄일 수 있어요.'],
  ['피크 시간대 회피', '저녁 6시~8시 세탁기·건조기 사용을 오후로 분산', '누진 구간이 올라가는 저녁 피크 시간대에 사용량이 몰려 있어요. 사용 시간을 분산하면 예상 요금을 낮출 수 있어요.'],
  ['누진 구간 경고', '이번 달 누적 사용량이 2단계 진입 임계치에 근접', '현재 페이스라면 이번 달 누진 2단계 구간에 진입할 가능성이 높아요. 대기전력이 큰 콘센트부터 점검해보세요.'],
  ['자동화 제안', '책상 멀티탭 자정 이후 자동 차단 규칙 추가', '자정 이후에도 미세하게 전력이 소비되고 있어요. 자동 차단 규칙을 추가하면 불필요한 소비를 막을 수 있어요.'],
]);
