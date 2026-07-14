export function buildDashboardCoachMarkSteps({ showHomeTwin = true } = {}) {
  const sidebarSteps = [
    {
      selector: '[data-coachmark="nav-chat"]',
      extraSelector: '[data-coachmark="header-waveai"]',
      title: 'WaveAI',
      description: '자연어로 집안 기기를 제어하고 궁금한 점을 물어볼 수 있는 AI 비서에요. "거실 조명 꺼줘"같은 대화를 나눠보세요. 오른쪽 상단의 WaveAI 버튼으로도 어디서나 팝업화면을 열 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-sleep"]',
      title: '수면 관리',
      description: '비접촉 레이더로 측정한 수면 단계·호흡·혈중 산소와 매일 아침 원인까지 짚어주는 AI 리포트를 볼 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-weeklyPlan"]',
      title: '주간 계획',
      description: '할 일과 일정을 한 주 단위로 관리하고, AI가 제안하는 루틴을 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-alarm"]',
      title: '스마트 알람',
      description: '소리 대신 빛으로 자연스럽게 깨워주는 알람 등, 나에게 맞는 기상 방식을 설정할 수 있어요.',
      placement: 'right',
    },
    showHomeTwin && {
      selector: '[data-coachmark="nav-homeTwin"]',
      title: '디지털 트윈 홈',
      description: '3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-home"]',
      title: '가전 제어',
      description: '조명·에어컨·TV 등 연결된 가전을 직접 켜고 끄거나 세부 설정을 바꿀 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-power"]',
      title: '전력 관리',
      description: '실시간 전력 사용량과 예상 요금, 절약 팁을 확인할 수 있어요.',
      placement: 'right',
    },
  ]
    .filter(Boolean)
    .map((step) => ({ ...step, anchorSelector: '.sidebar' }));

  const dashboardSteps = [
    {
      selector: '[data-coachmark="card-status"]',
      title: '현재 상태',
      description: '실내 환경, 수면 감지, 에이전트 서비스, 연결된 가전 상태를 한눈에 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-todos"]',
      title: '오늘 할일',
      description: '오늘 예정된 일정을 확인하고 완료 체크할 수 있어요. 카드를 누르면 주간 계획 페이지로 이동해요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-power"]',
      title: '전력 관리',
      description: '전체 콘센트의 실시간 사용량 그래프와 예상 요금을 볼 수 있어요. 눌러서 상세 분석으로 이동해보세요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-alarms"]',
      title: '예정된 알람',
      description: '오늘·내일 아침으로 예정된 알람을 미리 확인할 수 있어요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-gestures"]',
      title: '활성화된 제스처',
      description: '제스처로 자동 실행되도록 설정해둔 자동화 목록이에요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-sleep"]',
      title: '어젯밤 수면',
      description: '지난밤 수면 시간과 목표 달성률, 입면·기상 시각을 확인할 수 있어요.',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-sleepSummary"]',
      title: '수면 관리 요약',
      description: '오늘의 수면 점수와 오늘 밤 추천 취침·기상 시간을 확인할 수 있어요.',
      placement: 'left',
    }
  ];

  return [...sidebarSteps, ...dashboardSteps];
}
