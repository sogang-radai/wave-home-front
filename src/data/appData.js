export const pages = [
  { id: 'main', label: '대시보드', icon: 'dashboard' },
  {
    id: 'sleep',
    label: '수면 관리',
    icon: 'moon',
    tabs: [
      ['analysis', '수면 분석'],
      ['insight', '수면 인사이트'],
      ['alarm', '스마트 알람'],
    ],
  },
  // { id: 'posture', label: '자세 관리', icon: 'posture' },
  {
    id: 'power',
    label: '전력 관리',
    icon: 'lightning',
    tabs: [
      ['analysis', '전력 분석'],
      ['insight', '전력 인사이트'],
    ],
  },
  {
    id: 'home',
    label: '가전 제어',
    icon: 'remote',
    tabs: [
      ['trigger', '규칙 설정'],
      ['ir', '리모컨 등록'],
      ['control', '수동 제어'],
    ],
  },
];

/** Compact secondary nav items rendered under the upcoming-features block, with a separator. */
export const secondaryPages = [
  { id: 'chat', label: 'WaveChat', icon: 'waveai' },
  { id: 'twin', label: '디지털 트윈홈', icon: 'twin' },
  { id: 'weeklyPlan', label: 'AI 목표 플래너', icon: 'planner' },
];

export const upcomingFeatures = [
  {
    id: 'home-healthcare',
    label: '홈 헬스 케어',
    icon: 'home-healthcare',
    description:
      'AI가 자세, 운동, 식단을 분석해 개인 맞춤형 피드백을 제공하고 건강한 생활 습관 형성을 돕습니다.',
  },
  {
    id: 'senior-care',
    label: '시니어 케어',
    icon: 'senior-care',
    description:
      '낙상과 장시간 부동 등 위급 상황을 실시간으로 감지하고, 보호자에게 신속하게 알림을 전달합니다.',
  },
  {
    id: 'safe-homecare',
    label: '안심 홈케어',
    icon: 'safe-homecare',
    description:
      '이상 움직임과 화재·가스 등 위험 요소를 감지하고, 창문과 전원 등을 자동으로 제어하거나 알림을 제공해 더욱 안전한 주거 환경을 제공합니다.',
  },
];

export const pageTitles = {
  main: '대시보드',
  chat: 'WaveChat',
  weeklyPlan: 'AI 목표 플래너',
  twin: '디지털 트윈홈',
  sleep: '수면 관리',
  // posture: '자세 관리',
  power: '전력 관리',
  home: '가전 제어',
  setting: '설정',
};
