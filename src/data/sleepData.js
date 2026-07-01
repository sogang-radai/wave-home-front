import { withInsightIds } from '../components/report/InsightCard';

export const sleepTrend = [
  { day: '월', value: 6.2 },
  { day: '화', value: 7.1 },
  { day: '수', value: 5.8 },
  { day: '목', value: 7.5 },
  { day: '금', value: 6.9 },
  { day: '토', value: 8.2 },
  { day: '일', value: 7.0 },
];

// Read-only AI summaries of what's configured in 설정 > 수면 설정.
export const sleepSettingSummaries = [
  {
    title: '에어컨 자동 조절',
    text: '취침 전엔 26℃로 살짝 낮추고, 수면 중에는 25℃를 유지해요. 기상 30분 전부터는 27℃까지 서서히 올려서 상쾌하게 깨워드려요.',
  },
  {
    title: '입면 조명 조절',
    text: '취침 30분 전부터 조명이 서서히 어두워지기 시작해서, 취침 시각에는 밝기 10%까지 낮아져요.',
  },
  {
    title: '단계별 기상 알람',
    text: '기상 30분 전엔 조명이 서서히 밝아지고, 15분 전엔 잔잔한 수면 음악이 흘러나오고, 기상 시각엔 알람이 울려요.',
  },
  {
    title: '야간 도파민 차단',
    text: '야간에 스마트폰 사용이 감지되면 클래식 수면 음악이 자동으로 재생돼서 다시 잠들기 쉽도록 도와드려요.',
  },
];

export const sleepStageLog = [
  { time: '23:40', stage: '얕은 수면', breath: 15, heart: 64, level: 42 },
  { time: '00:40', stage: '깊은 수면', breath: 13, heart: 58, level: 72 },
  { time: '01:40', stage: '깊은 수면', breath: 12, heart: 55, level: 84 },
  { time: '02:40', stage: 'REM', breath: 16, heart: 62, level: 55 },
  { time: '03:40', stage: '얕은 수면', breath: 18, heart: 69, level: 36 },
  { time: '04:40', stage: '깊은 수면', breath: 14, heart: 57, level: 76 },
  { time: '05:40', stage: 'REM', breath: 17, heart: 66, level: 50 },
  { time: '06:40', stage: '기상', breath: 19, heart: 72, level: 28 },
];

export const sleepScoreFactors = [
  { label: '실제 수면 시간', value: '5시간 36분', tag: '주의', tone: 'attention' },
  { label: '깊은 수면', value: '45분', tag: '좋음', tone: 'good' },
  { label: 'REM 수면', value: '1시간 9분', tag: '좋음', tone: 'good' },
  { label: '각성', value: '49분', tag: '좋음', tone: 'good' },
  { label: '수면 잠복기', value: '6분', tag: '최고', tone: 'excellent' },
];

export const sleepStageBreakdown = [
  { label: '각성', pct: 12, time: '49분', tone: 'awake', typical: [4, 9] },
  { label: 'REM', pct: 17, time: '1시간 9분', tone: 'rem', typical: [19, 26] },
  { label: '얕은 수면', pct: 60, time: '3시간 42분', tone: 'light', typical: [45, 55] },
  { label: '깊은 수면', pct: 11, time: '45분', tone: 'deep', typical: [13, 23] },
];

export const sleepHypnogramSegments = [
  { stage: 'awake', minutes: 12 },
  { stage: 'light', minutes: 30 },
  { stage: 'deep', minutes: 22 },
  { stage: 'light', minutes: 28 },
  { stage: 'rem', minutes: 9 },
  { stage: 'awake', minutes: 9 },
  { stage: 'light', minutes: 34 },
  { stage: 'deep', minutes: 14 },
  { stage: 'light', minutes: 32 },
  { stage: 'rem', minutes: 13 },
  { stage: 'awake', minutes: 7 },
  { stage: 'light', minutes: 36 },
  { stage: 'deep', minutes: 9 },
  { stage: 'light', minutes: 32 },
  { stage: 'rem', minutes: 15 },
  { stage: 'awake', minutes: 8 },
  { stage: 'light', minutes: 30 },
  { stage: 'rem', minutes: 17 },
  { stage: 'awake', minutes: 13 },
  { stage: 'rem', minutes: 15 },
];

export const hypnogramTimeLabels = ['2:11 AM', '4:19 AM', '6:27 AM', '8:36 AM'];

// Fixed row position (% from the top of the chart) for each stage
export const HYPNOGRAM_LANES = { awake: 14, rem: 38, light: 62, deep: 86 };
export const HYPNOGRAM_BAND_PX = 5;

export const stageColorVar = {
  awake: 'var(--accent-stage-awake)',
  rem: 'var(--accent-plum)',
  light: 'var(--accent-stage-light)',
  deep: 'var(--accent-stage-deep)',
};

// One tick roughly every 5 minutes across the full 385-minute night
export const movementTicks = Array.from({ length: 77 }, (_, i) => 14 + ((i * 37) % 60));

export const snoringEpisodes = [
  { time: '01:12', duration: 4 },
  { time: '03:48', duration: 6 },
  { time: '05:20', duration: 3 },
];

export const sleepDailyInsights = withInsightIds([
  ['오늘의 권장 액션', '에어컨 예약을 새벽 4시까지 1시간 연장', '최근 3일 동안 방 온도가 26℃를 넘으면 뒤척임이 눈에 띄게 늘었어요. 에어컨 예약을 새벽 4시까지 1시간 늘려볼게요.'],
  ['취침 전 루틴', '23:00 스마트폰 차단 · 23:20 조도 낮춤 · 23:30 취침', '화면을 오래 보면 수면 부채가 쌓이기 쉬워요. 23:00엔 스마트폰을 멀리하고 23:20엔 조명을 낮춘 뒤 23:30에 잠들어보세요.'],
  ['자동화 제안', '기상 30분 전 조명 20% → 60%로 서서히 상승', '심박이 안정적으로 올라오는 구간에 맞춰 빛을 천천히 늘리면 더 가볍게 깰 수 있어요.'],
]);

export const sleepDailyAnalysis = [
  ['수면 점수', '82점', '전일 대비 +4점'],
  ['총 수면 시간', '6h 52m', '목표 7h 30m 대비 -38분'],
  ['입면 시간', '27분', '스마트폰 사용 후 지연'],
  ['뒤척임 집중 시간', '03:05~03:40', '온도 26℃ 이상 구간'],
  ['수면 부채', '2h 10m', '이번 주 안에 회복 권장'],
];

export const sleepWeeklyScores = [
  ['월', 74],
  ['화', 76],
  ['수', 79],
  ['목', 80],
  ['금', 82],
  ['토', 87],
  ['일', 89],
];

export const sleepWeeklyTrendData = sleepTrend.map((item, index) => ({
  day: item.day,
  hours: item.value,
  score: sleepWeeklyScores[index][1],
}));

export const sleepWeeklyInsights = withInsightIds([
  ['다음 주 목표', '평일 23:30 이전 취침 4회 달성', '주말 회복 수면에 의존하지 않도록 평일 수면 총량을 먼저 올려야 합니다.'],
  ['수면 부채 회복 플랜', '월~목 20분씩 추가 수면, 금요일은 7시간 30분 확보', '한 번에 몰아서 자는 것보다 평일에 조금씩 갚는 쪽이 리듬 유지에 유리합니다.'],
  ['환경 자동화', '새벽 1시~4시 냉방 유지, 기상 30분 전 조명 알람', '온도와 기상 리듬을 같이 고정하면 뒤척임과 수면 관성을 줄일 가능성이 큽니다.'],
]);
