import { withInsightIds } from '../components/report/InsightCard';

export const postureBars = [
  { label: '09', value: 78, turtleNeck: 1 },
  { label: '10', value: 84, turtleNeck: 0 },
  { label: '11', value: 68, turtleNeck: 3 },
  { label: '12', value: 73, turtleNeck: 2 },
  { label: '14', value: 88, turtleNeck: 0 },
  { label: '15', value: 71, turtleNeck: 2 },
  { label: '16', value: 76, turtleNeck: 1 },
];

export const postureLog = [
  { time: '09:00', label: '좋음', score: 88 },
  { time: '10:00', label: '주의', score: 74 },
  { time: '11:00', label: '거북목', score: 62 },
  { time: '13:00', label: '좋음', score: 86 },
  { time: '14:00', label: '허리 기울어짐', score: 68 },
  { time: '15:00', label: '교정 필요', score: 54 },
  { time: '16:00', label: '휴식 필요', score: 48 },
  { time: '17:00', label: '회복', score: 79 },
];

export const postureDailyInsights = withInsightIds([
  ['오늘의 권장 액션', '50분마다 목 스트레칭, 오후 3시 전 모니터 높이 재확인', '목이 먼저 무너지는 날은 허리를 펴기보다 시선 높이를 먼저 맞추는 편이 좋습니다.'],
  ['추천 루틴', '턱 당기기 20초 · 어깨 열기 20초 · 1분 기지개', '장시간 움직임이 없을 때는 자세 교정보다 짧은 휴식 제안이 우선입니다.'],
  ['알림 조정', '거북목은 8분 지속 시 음성 안내, 허리는 반복 3회부터 안내', '가벼운 흔들림은 대시보드 알림으로 두고 반복 패턴만 음성으로 올리는 구성이 적절합니다.'],
  ['추천 루틴', '45분마다 기지개 알림', '오후 3시~5시에는 집중도가 높아질수록 고개가 앞으로 나오는 패턴이 반복되었습니다. 45분마다 기지개 알림을 받아 목과 허리 자세를 함께 리셋해보세요.'],
]);

export const postureWeeklyInsights = withInsightIds([
  ['다음 주 목표', '50분 착석 후 1분 휴식 4회, 오후 3시 이후 거북목 20% 감소', '가장 무너지는 시간대가 고정되어 있어 선제 알림을 앞당기는 편이 좋습니다.'],
  ['추천 루틴', '허리 리셋 하루 2회 · 목 리셋 하루 2회 · 1분 걷기', '허리 굽음은 증가했으므로 목 교정 루틴과 별도로 골반 세우기 루틴을 추가하세요.'],
  ['알림 전략', '1단계는 화면 표시, 2단계부터 음성 안내, 3단계는 휴식 제안', '계속 교정만 요구하면 피로도가 커지므로 장시간 무움직임에는 휴식 제안이 더 적합합니다.'],
  ['추천 루틴', '45분마다 기지개 알림', '허리 굽음 빈도가 9% 늘었어요. 목 지표는 좋아졌지만 골반이 무너지며 허리가 말리는 보상 패턴이 생겼으니, 45분마다 기지개 알림으로 허리도 함께 챙겨보세요.'],
  ['다음 주 체크포인트', '휴식 루틴 수행률 64% → 80%', '루틴 수행률이 올라가면 장시간 착석 알림과 거북목 지속 시간이 함께 줄 가능성이 높습니다.'],
]);

export const postureWeeklyTrendData = [
  { day: '월', score: 74 },
  { day: '화', score: 76 },
  { day: '수', score: 78 },
  { day: '목', score: 80 },
  { day: '금', score: 81 },
  { day: '토', score: 86 },
  { day: '일', score: 92 },
];
