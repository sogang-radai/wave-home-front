export function buildDashboardCoachMarkSteps({ showHomeTwin = true } = {}) {
  const sidebarSteps = [
    {
      selector: '[data-coachmark="nav-sleep"]',
      title: '수면 관리',
      description: '매일 아침 AI 리포트를 볼 수 있어요. 수면 단계·호흡·코골이 기록은 수면 분석 탭에서, AI가 짚어주는 실행 제안·팁은 수면 인사이트 탭에서 확인해보세요. 수면 및 장치 알람 탭에서 기상과 함께 조명 같은 기기도 제어하는 알람을 관리할 수 있어요.',
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
      title: 'IoT 가전 제어',
      description: '연결된 가전을 한눈에 보고 개별적으로 제어할 수 있어요. 자동화·예약, 적외선 명령, 제스처 목록도 여기서 관리해요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-chat"]',
      extraSelector: '[data-coachmark="header-waveai"]',
      title: 'WaveChat',
      description: '자연어로 집안 기기를 제어하고 궁금한 점을 물어볼 수 있는 AI 비서에요. "거실 조명 꺼줘"같은 대화를 나눠보세요. 오른쪽 상단의 WaveChat 버튼으로도 어디서나 팝업화면을 열 수 있어요.',
      placement: 'right',
    },
    showHomeTwin && {
      selector: '[data-coachmark="nav-twin"]',
      title: '트윈홈',
      description: '3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인하고 제어할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="nav-weeklyPlan"]',
      title: '루틴 플래너',
      description: '할 일과 일정을 한 주 단위로 관리하고, AI가 제안하는 루틴을 확인할 수 있어요.',
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
      selector: '[data-coachmark="card-alarms"]',
      title: '예정된 알람',
      description: '오늘·내일 아침으로 예정된 알람을 미리 확인할 수 있어요. 조명이나 소리로 깨워드릴 수 있어요. ',
      placement: 'left',
    },
    {
      selector: '[data-coachmark="card-power"]',
      title: '전력 관리',
      description: '실시간 사용량과 이번 주 사용량 그래프, 예상 요금을 확인할 수 있어요. 눌러서 상세 분석으로 이동해보세요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-status"]',
      title: '홈 현황',
      description: '실내 환경, 수면 감지, 연결된 가전 상태를 한눈에 확인할 수 있어요.',
      placement: 'right',
    },
    {
      selector: '[data-coachmark="card-gestures"]',
      title: '활성화된 제스처',
      description: '현재 활성화된 제스쳐들의 목록입니다. 이 제스처들로 가전을 제어할 수 있어요. 눌러서 제스처 설정으로 이동해보세요.',
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
