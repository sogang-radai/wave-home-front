export const pages = [
  { id: 'main', label: '대시보드', icon: 'dashboard' },
  // { id: 'overview', label: '삼성 헬스 예시', icon: 'heart' },
  { id: 'sleep', label: '수면 관리', icon: 'moon' },
  { id: 'posture', label: '자세 관리', icon: 'posture' },
  { id: 'home', label: '가전 제어', icon: 'power' },
  { id: 'weeklyPlan', label: '헬스 루틴', icon: 'calendar' }
];

export const pageTitles = {
  main: '대시보드',
  overview: '삼성헬스 예시',
  weeklyPlan: '헬스 루틴',
  sleep: '수면 관리',
  posture: '자세 관리',
  home: '가전 제어',
  setting: '설정',
  chat: 'WaveAI',
};

export const initialNotifications = [
  { id: 1, type: 'timer', msg: '착석 1시간 48분 경과 — 스트레칭을 해보세요', time: '방금 전', read: false },
  { id: 2, type: 'sleep', msg: '오늘 수면 목표까지 30분 부족합니다', time: '오전 7:12', read: false },
  { id: 3, type: 'posture', msg: '거북목 패턴 4회 감지됨', time: '오후 2:35', read: true },
  { id: 4, type: 'temperature', msg: '수면 중 실내 온도 자동 조절 작동 (25°C)', time: '어제 23:12', read: true },
];

export const initialAccounts = [
  { id: 'kim', name: '김건강' },
  { id: 'park', name: '박웰빙' },
];
