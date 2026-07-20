export function buildDashboardCoachMarkSteps({ showHomeTwin = true } = {}) {
  const sidebarSteps = [
    {
      selector: '[data-coachmark="nav-chat"]',
      extraSelector: '[data-coachmark="header-waveai"]',
      title: 'WaveChat',
      description: '자연어로 집안 기기를 제어하고 궁금한 점을 물어볼 수 있는 AI 비서에요. "거실 조명 꺼줘"같은 대화를 나눠보세요. 오른쪽 상단의 WaveChat 버튼으로도 어디서나 팝업화면을 열 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-sleep"]',
      title: '수면 관리',
      description: '매일 아침 수면 문제의 원인까지 짚어주는 AI 리포트를 볼 수 있어요. 비접촉 방식으로 측정한 수면 단계·호흡·코골이 기록도 나와있어요. 알람 탭에서 스마트 기상 알람도 함께 관리할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-power"]',
      title: '전력 관리',
      description: '실시간 전력 사용량과 예상 요금, 절약 팁을 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-home"]',
      title: '가전 관리',
      description: showHomeTwin
        ? '조명·에어컨·TV 등 연결된 가전을 직접 켜고 끄거나 세부 설정을 바꿀 수 있어요. 디지털 트윈 홈 탭에서는 3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인할 수 있어요.'
        : '조명·에어컨·TV 등 연결된 가전을 직접 켜고 끄거나 세부 설정을 바꿀 수 있어요.',
      placement: 'right',
    },
  ]
    .filter(Boolean)
    .map((step) => ({ ...step, anchorSelector: '.sidebar' }));

  const dashboardSteps = [
    {
      selector: '[data-coachmark="card-sleep"]',
      title: '어젯밤 수면',
      description: '지난밤 수면 시간과 목표 달성률, 입면·기상 시각을 확인할 수 있어요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-power"]',
      title: '전력 관리',
      description: '전체 콘센트의 실시간 사용량 그래프와 예상 요금을 볼 수 있어요. 눌러서 상세 분석으로 이동해보세요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-gestures"]',
      title: '활성화된 제스처',
      description: '현재 활성화된 제스쳐들의 목록입니다. 이 제스처들로 가전을 제어할 수 있어요. 눌러서 제스처 설정으로 이동해보세요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-alarms"]',
      title: '예정된 알람',
      description: '오늘·내일 아침으로 예정된 알람을 미리 확인할 수 있어요. 조명이나 소리로 깨워드릴 수 있어요. ',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-status"]',
      title: '홈 현황',
      description: '실내 환경, 수면 감지, 연결된 가전 상태를 한눈에 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-todos"]',
      title: '오늘 할일',
      description: '오늘 예정된 일정을 확인하고 완료 체크할 수 있어요. 카드를 누르면 주간 계획 페이지로 이동해요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-weeklyplan"]',
      title: '주간 계획',
      description: '할 일과 일정을 한 주 단위로 관리하고, AI가 제안하는 루틴을 확인할 수 있어요. 목표를 작성하면 AI가 일정을 추천해주고, 달성률을 추적할 수 있어요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="nav-brand"]',
      anchorSelector: '.sidebar',
      title: 'WaveHome',
      description: '로고를 누르면 언제든 랜딩 페이지로 돌아갈 수 있어요. 안내는 여기까지예요, 이제 WaveHome을 자유롭게 둘러보세요!',
      placement: 'right',
    }
  ];

  return [...sidebarSteps, ...dashboardSteps];
}

// 가전 관리의 자동화 관리/적외선 명령/제스처 관리 탭 — 세 탭을 한 번에
// 소개하는 투어가 아니라, 그 탭에 들어갈 때마다 해당 탭의 코치마크 하나만
// 뜬다(App.js가 tabId로 이 맵을 조회해서 1개짜리 steps 배열을 넘긴다).
const HOME_CONTROL_COACH_MARK_STEPS = {
  trigger: [
    {
      selector: '[data-coachmark="hometab-trigger"]',
      title: '자동화 관리',
      description: '기기 상태·제스처·적외선 신호를 감지해 자동으로 실행하는 자동 감지와, 정해진 시각에 실행하는 자동 예약을 한 화면에서 만들고 관리할 수 있어요.',
      placement: 'bottom',
    },
  ],
  ir: [
    {
      selector: '[data-coachmark="hometab-ir"]',
      title: '적외선 명령',
      description: 'Wave Station이 리모컨 신호를 직접 받아 등록하거나 직접 입력해서, 에어컨·TV 같은 적외선 기기도 여기서 제어할 수 있게 만들어요.',
      placement: 'bottom',
    },
  ],
  gesture: [
    {
      selector: '[data-coachmark="hometab-gesture"]',
      title: '제스처 관리',
      description: '레이더에 구성된 제스처와, 각 동작에 연결된 자동화를 확인하는 화면이에요.',
      placement: 'bottom',
    },
  ],
};

export function buildHomeControlCoachMarkSteps(tabId) {
  return HOME_CONTROL_COACH_MARK_STEPS[tabId] || [];
}
