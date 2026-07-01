import { createContext, useContext, useMemo, useRef, useEffect, useState } from 'react';
import {
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  Area,
  Bar,
  Cell,
  LabelList,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './App.css';
import logo from './img/logo.png';

// Lets InsightCard (rendered deep inside sleep/posture reports) and the Weekly Plan page
// share which AI-recommended actions have been approved, without prop-drilling through
// SleepPage/PosturePage/WeeklyPlanPage.
const ApprovedActionsContext = createContext({ approved: {}, toggle: () => {} });

function useApprovedActions() {
  return useContext(ApprovedActionsContext);
}

const pages = [
  { id: 'main', label: '대시보드', icon: 'dashboard' },
  // { id: 'overview', label: '삼성 헬스 예시', icon: 'heart' },
  { id: 'sleep', label: '수면 관리', icon: 'moon' },
  { id: 'posture', label: '자세 관리', icon: 'posture' },
  { id: 'home', label: '가전 제어', icon: 'power' },
  { id: 'weeklyPlan', label: '주간 계획', icon: 'calendar' }
];

const initialNotifications = [
  { id: 1, type: 'timer', msg: '착석 1시간 48분 경과 — 스트레칭을 해보세요', time: '방금 전', read: false },
  { id: 2, type: 'sleep', msg: '오늘 수면 목표까지 30분 부족합니다', time: '오전 7:12', read: false },
  { id: 3, type: 'posture', msg: '거북목 패턴 4회 감지됨', time: '오후 2:35', read: true },
  { id: 4, type: 'temperature', msg: '수면 중 실내 온도 자동 조절 작동 (25°C)', time: '어제 23:12', read: true },
];

const initialAccounts = [
  { id: 'kim', name: '김건강' },
  { id: 'park', name: '박웰빙' },
];

const pageTitles = {
  main: '대시보드',
  overview: '삼성헬스 예시',
  weeklyPlan: '주간 계획',
  sleep: '수면 관리',
  posture: '자세 관리',
  home: '가전 제어',
  setting: '설정',
  chat: 'WaveAI',
};

const sleepTrend = [
  { day: '월', value: 6.2 },
  { day: '화', value: 7.1 },
  { day: '수', value: 5.8 },
  { day: '목', value: 7.5 },
  { day: '금', value: 6.9 },
  { day: '토', value: 8.2 },
  { day: '일', value: 7.0 },
];

// Read-only AI summaries of what's configured in 설정 > 수면 설정. Editing happens there;
// this just explains in plain sentences what will happen tonight.
const sleepSettingSummaries = [
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

const heartRateTrend = [
  { day: '00시', value: 58 },
  { day: '03시', value: 54 },
  { day: '06시', value: 62 },
  { day: '09시', value: 75 },
  { day: '12시', value: 82 },
  { day: '15시', value: 71 },
  { day: '18시', value: 69 },
  { day: '21시', value: 60 },
];

const postureBars = [
  { label: '09', value: 78, turtleNeck: 1 },
  { label: '10', value: 84, turtleNeck: 0 },
  { label: '11', value: 68, turtleNeck: 3 },
  { label: '12', value: 73, turtleNeck: 2 },
  { label: '14', value: 88, turtleNeck: 0 },
  { label: '15', value: 71, turtleNeck: 2 },
  { label: '16', value: 76, turtleNeck: 1 },
];

const sleepStageLog = [
  { time: '23:40', stage: '얕은 수면', breath: 15, heart: 64, level: 42 },
  { time: '00:40', stage: '깊은 수면', breath: 13, heart: 58, level: 72 },
  { time: '01:40', stage: '깊은 수면', breath: 12, heart: 55, level: 84 },
  { time: '02:40', stage: 'REM', breath: 16, heart: 62, level: 55 },
  { time: '03:40', stage: '얕은 수면', breath: 18, heart: 69, level: 36 },
  { time: '04:40', stage: '깊은 수면', breath: 14, heart: 57, level: 76 },
  { time: '05:40', stage: 'REM', breath: 17, heart: 66, level: 50 },
  { time: '06:40', stage: '기상', breath: 19, heart: 72, level: 28 },
];

const postureLog = [
  { time: '09:00', label: '좋음', score: 88 },
  { time: '10:00', label: '주의', score: 74 },
  { time: '11:00', label: '거북목', score: 62 },
  { time: '13:00', label: '좋음', score: 86 },
  { time: '14:00', label: '허리 기울어짐', score: 68 },
  { time: '15:00', label: '교정 필요', score: 54 },
  { time: '16:00', label: '휴식 필요', score: 48 },
  { time: '17:00', label: '회복', score: 79 },
];

const sleepScoreFactors = [
  { label: '실제 수면 시간', value: '5시간 36분', tag: '주의', tone: 'attention' },
  { label: '깊은 수면', value: '45분', tag: '좋음', tone: 'good' },
  { label: 'REM 수면', value: '1시간 9분', tag: '좋음', tone: 'good' },
  { label: '각성', value: '49분', tag: '좋음', tone: 'good' },
  { label: '수면 잠복기', value: '6분', tag: '최고', tone: 'excellent' },
];

const sleepStageBreakdown = [
  { label: '각성', pct: 12, time: '49분', tone: 'awake', typical: [4, 9] },
  { label: 'REM', pct: 17, time: '1시간 9분', tone: 'rem', typical: [19, 26] },
  { label: '얕은 수면', pct: 60, time: '3시간 42분', tone: 'light', typical: [45, 55] },
  { label: '깊은 수면', pct: 11, time: '45분', tone: 'deep', typical: [13, 23] },
];

// Single chronological timeline — every segment (including awake) sits in its own fixed
// lane (see HYPNOGRAM_LANES) and the chart connects them with vertical lines on transition,
// like a real hypnogram. Minutes sum to 385 (6h 25m), matching the totals above.
const sleepHypnogramSegments = [
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

const hypnogramTimeLabels = ['2:11 AM', '4:19 AM', '6:27 AM', '8:36 AM'];

// Fixed row position (% from the top of the chart) for each stage — row 1 awake, row 2 REM,
// row 3 light, row 4 deep — so the line always sits at the same height per stage.
const HYPNOGRAM_LANES = { awake: 14, rem: 38, light: 62, deep: 86 };
const HYPNOGRAM_BAND_PX = 5;

const stageColorVar = {
  awake: 'var(--accent-stage-awake)',
  rem: 'var(--accent-plum)',
  light: 'var(--accent-stage-light)',
  deep: 'var(--accent-stage-deep)',
};

// One tick roughly every 5 minutes across the full 385-minute night, so movement reads as
// continuous activity for the whole sleep period rather than a short cluster.
const movementTicks = Array.from({ length: 77 }, (_, i) => 14 + ((i * 37) % 60));

const spo2Trend = [
  { day: '11PM', value: 97 },
  { day: '1AM', value: 96 },
  { day: '3AM', value: 95 },
  { day: '5AM', value: 96 },
  { day: '7AM', value: 97 },
  { day: '8AM', value: 96 },
];

const snoringEpisodes = [
  { time: '01:12', duration: 4 },
  { time: '03:48', duration: 6 },
  { time: '05:20', duration: 3 },
];

const overviewBanners = [
  '오늘도 잘 해내고 있어요. 최근 평균 수면시간이 6시간 25분이에요. 8시간을 목표로 조금씩 늘려보면 에너지 점수가 더 좋아질 거예요. 지금의 활동량을 유지하면서 계속 힘내봐요!',
  '자세 점수가 어제보다 4점 올랐어요. 오후 3시 이후 거북목 패턴이 줄었으니 같은 루틴을 유지해보세요.',
  '심박수가 안정적인 범위를 유지하고 있어요. 오늘도 50분 착석마다 1분 스트레칭을 잊지 마세요.',
];

const energyWeekBars = [
  { label: '20', value: 58 },
  { label: '21', value: 64 },
  { label: '22', value: 60 },
  { label: '23', value: 70 },
  { label: '24', value: 66 },
  { label: '25', value: 72 },
  { label: '26', value: 77 },
];

const overviewQuickActions = [
  { label: '체성분', tone: 'plum' },
  { label: '수분', tone: 'blue' },
  { label: '걷기', tone: 'green' },
  { label: '더보기', tone: 'gray' },
];

const overviewFeatureTiles = [
  { id: 'cycle', title: '생리주기 기록', desc: '주기를 기록하고 다음 예상일을 확인하세요.', tone: 'pink', muted: true },
  { id: 'medication', title: '복약 관리', desc: '복용 중인 약을 등록하고 알림을 받아보세요.', tone: 'mint', muted: true },
  { id: 'records', title: '건강 기록', desc: '건강검진 결과와 기록을 한 곳에서 모아보세요.', tone: 'gray', muted: true },
];

const koreanWeekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
const todayWeekdayLabel = koreanWeekdayLabels[new Date().getDay()];

const initialTodos = [
  { id: 1, title: '오후 4시 목 스트레칭', done: false, day: todayWeekdayLabel, cat: '자세' },
  { id: 2, title: '수분 섭취 2L', done: false, day: todayWeekdayLabel, cat: '식습관' },
  { id: 3, title: '자정 전 취침', done: false, day: todayWeekdayLabel, cat: '수면' },
  { id: 4, title: '오후 10시 이후 화면 밝기 줄이기', done: false, day: todayWeekdayLabel, cat: '수면' },
  { id: 5, title: '저녁 스트레칭 10분', done: false, day: todayWeekdayLabel, cat: '자세' },
];

const gestureHistory = [
  { id: 1, gesture: '손 올리기', device: '거실 조명', action: '전원 켜기', time: '방금 전', confidence: 96 },
  { id: 2, gesture: '오른쪽 스와이프', device: '침실 에어컨', action: '온도 1℃ 낮춤', time: '8분 전', confidence: 91 },
  { id: 3, gesture: '주먹 쥐기', device: '서재 스피커', action: '일시정지', time: '23분 전', confidence: 88 },
  { id: 4, gesture: '왼쪽 스와이프', device: '거실 커튼', action: '닫기', time: '오늘 09:12', confidence: 94 },
];

const gestureSets = [
  {
    id: 'daily',
    name: 'Daily Control',
    description: '조명, 커튼, 스피커처럼 자주 쓰는 가전을 빠르게 제어합니다.',
    status: '활성 세트',
    gestureCount: 5,
    gestures: [
      { id: 1, name: '손 올리기', action: '조명 켜기', status: 'active' },
      { id: 2, name: '손 내리기', action: '조명 끄기', status: 'active' },
      { id: 3, name: '왼쪽 스와이프', action: '커튼 닫기', status: 'active' },
      { id: 4, name: '오른쪽 스와이프', action: '커튼 열기', status: 'active' },
      { id: 5, name: '주먹 쥐기', action: '미디어 일시정지', status: 'active' },
    ],
  },
  {
    id: 'sleep',
    name: '수면 모드',
    description: '취침 전 조명, 온도, 소리를 한 번에 낮추는 루틴 세트입니다.',
    status: '대기',
    gestureCount: 4,
    gestures: [
      { id: 6, name: '손바닥 보이기', action: '수면 모드 시작', status: 'active' },
      { id: 7, name: '원 그리기', action: '무드등 20%', status: 'inactive' },
      { id: 8, name: '두 번 탭', action: '백색소음 재생', status: 'active' },
      { id: 9, name: '아래 스와이프', action: '에어컨 24℃', status: 'active' },
    ],
  },
  {
    id: 'focus',
    name: '집중 모드',
    description: '책상 앞에서 방해 요소를 줄이고 조명과 소리를 집중 환경으로 맞춥니다.',
    status: '대기',
    gestureCount: 4,
    gestures: [
      { id: 10, name: '두 손 모으기', action: '집중 조명 켜기', status: 'active' },
      { id: 11, name: '앞으로 밀기', action: '스피커 볼륨 낮춤', status: 'active' },
      { id: 12, name: '손바닥 가리기', action: '알림 음소거', status: 'active' },
      { id: 13, name: '위로 스와이프', action: '공기청정기 강풍', status: 'inactive' },
    ],
  },
  {
    id: 'rest',
    name: '휴식 모드',
    description: '휴식 시간에 맞춰 조명은 부드럽게, 음악과 온도는 편안하게 조절합니다.',
    status: '대기',
    gestureCount: 4,
    gestures: [
      { id: 14, name: '손 흔들기', action: '휴식 음악 재생', status: 'active' },
      { id: 15, name: '손바닥 위로', action: '무드등 밝게', status: 'active' },
      { id: 16, name: '손바닥 아래로', action: '무드등 낮춤', status: 'active' },
      { id: 17, name: '원 크게 그리기', action: '커튼 반쯤 열기', status: 'inactive' },
    ],
  },
];

const iotDevices = [
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

function App() {
  const [page, setPage] = useState('main');
  const [sleepTab, setSleepTab] = useState('report');
  const [postureTab, setPostureTab] = useState('current');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const markAllNotificationsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };
  const [todos, setTodos] = useState(initialTodos);
  const toggleTodo = (id) => {
    setTodos((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };
  const addTodo = (title, day, cat) => {
    setTodos((current) => [...current, { id: Date.now(), title, done: false, day, cat }]);
  };
  const [approvedActions, setApprovedActions] = useState({});
  const toggleApprovedAction = (id) => {
    setApprovedActions((current) => ({ ...current, [id]: !current[id] }));
  };
  const [settingCategory, setSettingCategory] = useState('devices');
  const goToSleepSettings = () => {
    setPage('setting');
    setSettingCategory('sleep');
  };
  const [chatConversations, setChatConversations] = useState(initialChatConversations);
  const [activeChatId, setActiveChatId] = useState(null);
  const [waveTransition, setWaveTransition] = useState(false);
  const bubbleAudioCtxRef = useRef(null);
  const [chatMode, setChatMode] = useState('page'); // 'page' | 'popup' | 'mini'
  const [prevPage, setPrevPage] = useState('main');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const playBubbleTransitionSound = async () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!bubbleAudioCtxRef.current) {
      bubbleAudioCtxRef.current = new AudioContextClass();
    }

    const ctx = bubbleAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    [0, 0.07, 0.16, 0.25, 0.36].forEach((offset, index) => {
      const start = now + offset;
      const duration = 0.11 + index * 0.01;
      const base = 360 + Math.random() * 260 + index * 34;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(base, start);
      oscillator.frequency.exponentialRampToValueAtTime(base * 1.65, start + duration * 0.72);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.034, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  };

  const handleNavigateToChat = () => {
    if (chatMode === 'popup' || chatMode === 'mini') {
      playBubbleTransitionSound();
      setChatMode('page');
      setPage('chat');
      setSidebarCollapsed(true);
      return;
    }
    if (page === 'chat') {
      setActiveChatId(null);
      return;
    }
    setPrevPage(page);
    playBubbleTransitionSound();
    setWaveTransition(true);
    setSidebarCollapsed(true);
    setTimeout(() => {
      setPage('chat');
      setActiveChatId(null);
      setWaveTransition(false);
    }, 580);
  };

  const handleShrinkChat = () => {
    setChatMode('popup');
    setPage(prevPage || 'main');
  };

  const handleExpandChat = () => {
    setChatMode('page');
    setPage('chat');
  };

  const handleMiniChat = () => {
    setChatMode((m) => (m === 'mini' ? 'popup' : 'mini'));
  };

  const handleClosePopupChat = () => {
    setChatMode('page');
  };

  const addChatConversation = () => {
    const id = `chat-${Date.now()}`;
    setChatConversations((prev) => [{ id, title: '새 대화', messages: [] }, ...prev]);
    setActiveChatId(id);
  };

  const deleteChatConversation = (id) => {
    setChatConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const renameChatConversation = (id, title) => {
    setChatConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    let targetId = activeChatId;
    if (!targetId) {
      targetId = `chat-${Date.now()}`;
      const newConv = {
        id: targetId,
        title: text.slice(0, 22) + (text.length > 22 ? '…' : ''),
        messages: [],
      };
      setChatConversations((prev) => [newConv, ...prev]);
      setActiveChatId(targetId);
    }
    const reply = getInsightReply(text);
    setChatConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? { ...c, messages: [...c.messages, { role: 'user', text: text.trim() }, { role: 'assistant', text: reply }] }
          : c
      )
    );
  };
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountId, setAccountId] = useState(initialAccounts[0].id);
  const account = accounts.find((item) => item.id === accountId) || accounts[0];
  const renameAccount = (id, name) => {
    setAccounts((current) => current.map((item) => (item.id === id ? { ...item, name } : item)));
  };
  const addAccount = (name) => {
    setAccounts((current) => [...current, { id: `member-${Date.now()}`, name }]);
  };

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(new Date()),
    []
  );

  return (
    <ApprovedActionsContext.Provider value={{ approved: approvedActions, toggle: toggleApprovedAction }}>
      <div className="app-shell">
        <WaveTransitionOverlay active={waveTransition} />
        <InsightChat open={false} onClose={() => {}} />
        {(chatMode === 'popup' || chatMode === 'mini') && (
          <ChatPopup
            mode={chatMode}
            conversations={chatConversations}
            activeConvId={activeChatId}
            onSelectConv={setActiveChatId}
            onAddConv={addChatConversation}
            onDeleteConv={deleteChatConversation}
            onRenameConv={renameChatConversation}
            onSendMessage={sendChatMessage}
            onExpand={handleExpandChat}
            onMini={handleMiniChat}
            onClose={handleClosePopupChat}
          />
        )}
        <Sidebar
          page={page}
          onSelect={setPage}
          today={today}
          showNotifications={showNotifications}
          onToggleNotifications={() => setShowNotifications((value) => !value)}
          onCloseNotifications={() => setShowNotifications(false)}
          notifications={notifications}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          accounts={accounts}
          account={account}
          onSwitchAccount={setAccountId}
          showInsightChat={page === 'chat'}
          onToggleInsightChat={handleNavigateToChat}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          hideInsightTrigger={page === 'chat' && chatMode === 'page'}
        />
        <section className="workspace">
          <TopBar
            title={pageTitles[page]}
            showNotifications={showNotifications}
            onToggleNotifications={() => setShowNotifications((value) => !value)}
            onCloseNotifications={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkAllNotificationsRead={markAllNotificationsRead}
            accounts={accounts}
            account={account}
            onSwitchAccount={setAccountId}
            showInsightChat={page === 'chat'}
            onToggleInsightChat={handleNavigateToChat}
            hideInsightTrigger={page === 'chat' && chatMode === 'page'}
          />
          <main className={`content${page === 'chat' && chatMode === 'page' ? ' chat-active' : ''}`}>
            {page === 'main' && (
              <MainPage
                onNavigate={setPage}
                todos={todos}
                onToggleTodo={toggleTodo}
                onGoToSleepSettings={goToSleepSettings}
              />
            )}
            {page === 'overview' && <OverviewPage onNavigate={setPage} />}
            {page === 'sleep' && (
              <SleepPage tab={sleepTab} setTab={setSleepTab} onGoToSleepSettings={goToSleepSettings} />
            )}
            {page === 'posture' && <PosturePage tab={postureTab} setTab={setPostureTab} />}
            {page === 'weeklyPlan' && <WeeklyPlanPage todos={todos} onToggleTodo={toggleTodo} onAddTodo={addTodo} />}
            {page === 'home' && <HomeControlPage />}
            {page === 'setting' && (
              <SettingPage
                accounts={accounts}
                accountId={accountId}
                account={account}
                onSwitchAccount={setAccountId}
                onRenameAccount={renameAccount}
                onAddAccount={addAccount}
                category={settingCategory}
                setCategory={setSettingCategory}
              />
            )}
            {page === 'chat' && chatMode === 'page' && (
              <ChatPage
                conversations={chatConversations}
                activeConvId={activeChatId}
                onSelectConv={setActiveChatId}
                onAddConv={addChatConversation}
                onDeleteConv={deleteChatConversation}
                onRenameConv={renameChatConversation}
                onSendMessage={sendChatMessage}
                onShrink={handleShrinkChat}
              />
            )}
          </main>
        </section>
      </div>
    </ApprovedActionsContext.Provider>
  );
}

function Sidebar({
  page,
  onSelect,
  today,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  notifications,
  onMarkAllNotificationsRead,
  accounts,
  account,
  onSwitchAccount,
  showInsightChat,
  onToggleInsightChat,
  collapsed,
  onCollapsedChange,
  hideInsightTrigger,
}) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <img src={logo} alt="WaveHome" />
        </div>
        <div className="brand-text">
          <strong>WaveHome</strong>
          <span>Health Intelligence</span>
        </div>
        <button className="collapse-button" aria-label="collapse sidebar" onClick={() => onCollapsedChange((value) => !value)}>
          {collapsed ? '›' : '‹'}
        </button>
        <TopActionsCluster
          variant="mobile"
          showNotifications={showNotifications}
          onToggleNotifications={onToggleNotifications}
          onCloseNotifications={onCloseNotifications}
          notifications={notifications}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          accounts={accounts}
          account={account}
          onSwitchAccount={onSwitchAccount}
          showInsightChat={showInsightChat}
          onToggleInsightChat={onToggleInsightChat}
          hideInsightTrigger={hideInsightTrigger}
        />
      </div>

      <nav className="nav-list">
        {pages.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon"><SidebarIcon name={item.icon} /></span>
            <span className="nav-label">{item.label}</span>
            {page === item.id && <i />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <p className="sidebar-date">{today}</p>
        <button
          className={`nav-item bottom-setting ${page === 'setting' ? 'active' : ''}`}
          onClick={() => onSelect('setting')}
          title={collapsed ? 'Setting' : undefined}
        >
          <span className="nav-icon">⚙</span>
          <span className="nav-label">설정</span>
          {page === 'setting' && <i />}
        </button>
      </div>
    </aside>
  );
}

function SidebarIcon({ name }) {
  const common = {
    width: '20',
    height: '20',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    );
  }

  if (name === 'moon') {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg {...common}>
        <path d="M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
      </svg>
    );
  }

  if (name === 'posture') {
    return (
      <svg {...common}>
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 6.5v7" />
        <path d="M8.5 9.5h7" />
        <path d="M9 21l3-7.5 3 7.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function TopBar({ title, ...actionProps }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
      </div>
      <TopActionsCluster variant="desktop" {...actionProps} />
    </header>
  );
}

function TopActionsCluster({
  variant,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  notifications,
  onMarkAllNotificationsRead,
  accounts,
  account,
  onSwitchAccount,
  showInsightChat,
  onToggleInsightChat,
  hideInsightTrigger,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className={`top-actions top-actions-${variant}`}>
      {!hideInsightTrigger && (
        <button
          className={`insight-trigger ${showInsightChat ? 'active' : ''}`}
          aria-label="AI 인사이트 채팅"
          onClick={onToggleInsightChat}
        >
          <span className="insight-chat-spark" style={{ color: "#000" }}>✦</span>
          <span className="insight-trigger-label">WaveAI</span>
        </button>
      )}
      <button className="bell" aria-label="알림" onClick={onToggleNotifications}>
        <BellIcon />
        {unreadCount > 0 && <b>{unreadCount}</b>}
      </button>
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          onClose={onCloseNotifications}
        />
      )}
      <button
        className="profile profile-trigger"
        aria-label="프로필 메뉴"
        onClick={() => setShowProfileMenu((value) => !value)}
      >
        <span className="mini-avatar">{account.name.charAt(0)}</span>
        <span className="profile-text">
          <strong>{account.name}</strong>
        </span>
      </button>
      {showProfileMenu && (
        <ProfileMenu
          accounts={accounts}
          activeId={account.id}
          onSelect={(id) => {
            onSwitchAccount(id);
            setShowProfileMenu(false);
          }}
        />
      )}
    </div>
  );
}

function ProfileMenu({ accounts, activeId, onSelect }) {
  return (
    <div className="profile-menu">
      <div className="profile-menu-head">
        <strong>계정 전환</strong>
      </div>
      {accounts.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`profile-menu-item ${item.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="mini-avatar">{item.name.charAt(0)}</span>
          <span className="profile-text">
            <strong>{item.name}</strong>
          </span>
          {item.id === activeId && <i>✓</i>}
        </button>
      ))}
    </div>
  );
}

function CheckCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 4 4L17 5" />
      <path d="m9 11 4 4L23 5" />
    </svg>
  );
}

function NotificationTypeIcon({ type }) {
  const common = {
    width: '13',
    height: '13',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'var(--ink)',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (type === 'sleep') {
    return (
      <svg {...common}>
        <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a7 7 0 1 0 11.5 11.5Z" />
      </svg>
    );
  }

  if (type === 'posture') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (type === 'temperature') {
    return (
      <svg {...common}>
        <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="12" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

function NotificationsPanel({ notifications, onMarkAllRead, onClose }) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="notifications-panel relative z-20">
        <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>알림</p>
            {unreadCount > 0 && (
              <p className="text-xs" style={{ color: 'var(--sub)' }}>읽지 않은 알림 {unreadCount}개</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--wave-10)]"
                style={{ color: 'var(--ink)' }}
              >
                <CheckCheckIcon />
                모두 읽음
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="알림 닫기"
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-[var(--wave-10)]"
              style={{ color: 'var(--sub)' }}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((item) => (
            <div className="flex items-start gap-3 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }} key={item.id}>
              <div className="relative mt-0.5 shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: item.read ? 'var(--wave-10)' : 'var(--wave-20)' }}
                >
                  <NotificationTypeIcon type={item.type} />
                </div>
                {!item.read && (
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: 'var(--danger)' }} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs leading-snug ${item.read ? '' : 'font-semibold'}`} style={{ color: 'var(--ink)' }}>
                  {item.msg}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--sub)' }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const insightSuggestions = [
  '오늘 수면 인사이트 알려줘',
  '자세 점수가 왜 낮아졌어?',
  '오늘 심박수 어때?',
];

const CHAT_SUGGESTION_POOL = [
  { icon: '🌙', label: '수면 분석', prompt: '어젯밤 수면 점수를 분석해줘' },
  { icon: '🧘', label: '자세 교정', prompt: '거북목 개선 스트레칭 루틴 추천해줘' },
  { icon: '❤️', label: '심박 트렌드', prompt: '오늘 심박수가 평소와 다른 이유가 뭐야?' },
  { icon: '🏠', label: '가전 자동화', prompt: '취침 전 가전 자동화 설정 도와줘' },
  { icon: '📋', label: '주간 계획', prompt: '이번 주 건강 목표를 세워줘' },
  { icon: '💤', label: '수면 환경', prompt: '더 깊은 수면을 위한 실내 환경 알려줘' },
  { icon: '🌡️', label: '최적 온도', prompt: '수면에 최적인 실내 온도가 몇 도야?' },
  { icon: '⚡', label: '에너지 향상', prompt: '에너지 점수를 높이는 방법 알려줘' },
];

const initialChatConversations = [
  {
    id: 'chat-1',
    title: '수면 분석 질문',
    messages: [
      { role: 'assistant', text: '안녕하세요! 수면에 대해 궁금한 점이 있으신가요?' },
      { role: 'user', text: '어젯밤 수면 점수가 낮은 이유가 뭔가요?' },
      { role: 'assistant', text: '어젯밤 수면 점수가 낮은 주요 원인은 뒤척임이 많았던 03:05~03:40 구간이에요. 그 시간대 실내 온도가 26℃를 넘으면서 수면 질이 떨어졌어요. 에어컨 예약을 새벽 4시까지 1시간 연장해보시는 걸 추천드려요!' },
    ],
  },
  {
    id: 'chat-2',
    title: '자세 교정 루틴',
    messages: [
      { role: 'assistant', text: '자세 교정 루틴에 대해 알아볼까요?' },
      { role: 'user', text: '거북목 교정 스트레칭 알려줘' },
      { role: 'assistant', text: '거북목 교정에 좋은 스트레칭을 알려드릴게요!\n\n1. 턱 당기기 (Chin Tuck) — 10초 × 10회\n2. 목 옆으로 스트레칭 — 각 방향 20초\n3. 어깨 으쓱 후 내리기 — 5회 반복\n\n하루 3번, 특히 착석 50분 후에 해주세요 🧘' },
    ],
  },
  {
    id: 'chat-3',
    title: '심박수 트렌드',
    messages: [
      { role: 'assistant', text: '오늘 심박수 데이터를 분석해드릴게요.' },
    ],
  },
];

function getInsightReply(question) {
  const q = question.toLowerCase();
  if (q.includes('수면') || q.includes('잠')) {
    return '어젯밤 수면 시간은 7.0시간으로 7일 평균(7.2시간)과 비슷했지만 일일 목표인 7.5시간에는 살짝 못 미쳤어요. 입면은 23:42, 기상은 06:42였어요.';
  }
  if (q.includes('자세') || q.includes('거북목')) {
    return '오늘 자세 점수는 68점/100으로 다소 주의가 필요해요. 거북목이 4회 감지되었지만 전주 평균 7.3회보다는 개선된 편이에요.';
  }
  if (q.includes('심박') || q.includes('맥박') || q.includes('bpm')) {
    return '오늘 심박수는 평균 69bpm이고 최저 54bpm·최고 82bpm을 기록했어요. 현재 측정값은 62bpm으로 안정적인 범위예요.';
  }
  if (q.includes('레이더') || q.includes('연결')) {
    return '방 1 레이더는 정상적으로 연결되어 있어요. 기기등록 설정에서 구역별 연결 상태를 확인할 수 있어요.';
  }
  return '아직 답변을 준비 중인 질문이에요. 수면, 자세, 심박수에 대해 물어보시면 오늘 데이터를 바탕으로 알려드릴게요!';
}

function InsightChat({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '안녕하세요! WaveHome AI예요. 오늘의 수면, 자세, 심박 데이터에 대해 무엇이든 물어보세요.' },
  ]);
  const [draft, setDraft] = useState('');

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: getInsightReply(trimmed) },
    ]);
    setDraft('');
  };

  return (
    <aside className={`insight-chat ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="insight-chat-inner">
        <div className="insight-chat-head">
          <div className="insight-chat-brand">
            <span className="insight-chat-spark">✦</span>
            <strong>WaveAI</strong>
          </div>
          <button type="button" className="insight-chat-close" aria-label="채팅 닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="insight-chat-body">
          {messages.map((message, index) => (
            <div className={`insight-chat-bubble ${message.role}`} key={index}>
              {message.text}
            </div>
          ))}
        </div>

        <div className="insight-chat-suggestions">
          <p>이런 질문도 해보세요</p>
          <div className="insight-chat-chip-list">
            {insightSuggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <form
          className="insight-chat-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(draft);
          }}
        >
          <input
            type="text"
            placeholder="인사이트를 물어보세요"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" aria-label="보내기">↑</button>
        </form>
      </div>
    </aside>
  );
}

// ── Wave transition overlay ──────────────────────────────────────────────────

function WaveTransitionOverlay({ active }) {
  if (!active) return null;
  const bubbles = Array.from({ length: 18 }, (_, index) => ({
    left: 5 + ((index * 17) % 90),
    size: 15 + ((index * 7) % 28),
    delay: index * 0.018,
    duration: 0.62 + index * 0.018,
    drift: -26 + ((index * 13) % 54),
  }));
  return (
    <div className="wave-overlay" aria-hidden="true">
      <div className="wave-overlay-fill" />
      <div className="wave-overlay-ripple" />
      <div className="wave-overlay-surface">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none">
          <path d="M0,72 C130,130 260,18 420,74 C590,134 760,22 940,72 C1060,106 1130,78 1200,54 L1200,160 L0,160 Z" />
        </svg>
      </div>
      <div className="wave-overlay-bubbles">
        {bubbles.map((_, index) => (
          <span
            key={index}
            style={{
              '--bubble-left': `${bubbles[index].left}%`,
              '--bubble-size': `${bubbles[index].size}px`,
              '--bubble-delay': `${bubbles[index].delay}s`,
              '--bubble-duration': `${bubbles[index].duration}s`,
              '--bubble-drift': `${bubbles[index].drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Chat page ────────────────────────────────────────────────────────────────

function ChatPage({ conversations, activeConvId, onSelectConv, onAddConv, onDeleteConv, onRenameConv, onSendMessage, onShrink }) {
  const [convOpen, setConvOpen] = useState(false);
  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConversation?.messages || [];

  return (
    <div className="chat-page">
      <div className="chat-page-body">
        {convOpen && <div className="chat-conv-overlay" onClick={() => setConvOpen(false)} />}
        <ChatConvSidebar
          open={convOpen}
          onToggle={() => setConvOpen((o) => !o)}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={onSelectConv}
          onAdd={onAddConv}
          onDelete={onDeleteConv}
          onRename={onRenameConv}
        />
        <ChatMainArea
          messages={messages}
          isNewChat={!activeConvId || messages.length === 0}
          onSend={onSendMessage}
          onShrink={onShrink}
          onToggleConv={() => setConvOpen((o) => !o)}
          convOpen={convOpen}
        />
      </div>
    </div>
  );
}

function ChatConvSidebar({ open, onToggle, conversations, activeConvId, onSelect, onAdd, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  return (
    <aside className={`chat-conv-sidebar${open ? '' : ' collapsed'}`}>
      <div className="chat-conv-header">
        <button
          className="chat-conv-toggle-btn"
          onClick={onToggle}
          title={open ? '목록 닫기' : '대화 목록 열기'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button className="chat-new-btn" onClick={onAdd}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 대화
        </button>
      </div>

      <div className="chat-conv-list">
        {conversations.length === 0 && (
          <p className="chat-conv-empty">대화 내역이 없습니다</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`chat-conv-item${conv.id === activeConvId ? ' active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            {editingId === conv.id ? (
              <input
                className="chat-conv-edit-input"
                value={editTitle}
                autoFocus
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="chat-conv-title">{conv.title}</span>
                <div className="chat-conv-actions">
                  <button
                    className="chat-conv-action-btn"
                    title="이름 바꾸기"
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(conv); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="chat-conv-action-btn danger"
                    title="삭제"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ChatMainArea({ messages, isNewChat, onSend, onShrink, onToggleConv, convOpen }) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  const [shownSuggestions] = useState(() => {
    const shuffled = [...CHAT_SUGGESTION_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t) return;
    onSend(t);
    setDraft('');
  };

  return (
    <div className="chat-main-area">
      <div className="chat-main-topbar">
        {onToggleConv && !convOpen && (
          <button
            className="chat-conv-toggle-btn"
            onClick={onToggleConv}
            title="대화 목록 열기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {onShrink && (
          <button className="chat-shrink-btn" onClick={onShrink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
            </svg>
            작게 보기
          </button>
        )}
      </div>
      <div className="chat-messages-area">
        {isNewChat ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">✦</div>
            <h2 className="chat-welcome-title">WaveAI에게 무엇이든 물어보세요</h2>
            <p className="chat-welcome-sub">수면·자세·심박·가전까지, 건강 데이터 기반으로 답변드려요</p>
            <div className="chat-suggestions-grid">
              {shownSuggestions.map((s) => (
                <button key={s.label} className="chat-suggestion-card" onClick={() => handleSend(s.prompt)}>
                  <span className="chat-suggestion-icon">{s.icon}</span>
                  <strong>{s.label}</strong>
                  <span>{s.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-bubble-list">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-bubble-avatar">✦</div>
                )}
                <div className={`chat-bubble ${msg.role}`}>{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form
          className="chat-input-form"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <input
            className="chat-input"
            type="text"
            placeholder="메시지를 입력하세요..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" aria-label="보내기" disabled={!draft.trim()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Chat popup (floating, popup / mini mode) ─────────────────────────────────

function ChatPopup({ mode, conversations, activeConvId, onSelectConv, onAddConv, onSendMessage, onExpand, onMini, onClose }) {
  const [draft, setDraft] = useState('');
  const [showConvList, setShowConvList] = useState(false);
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConv?.messages || [];
  const isNewChat = !activeConvId || messages.length === 0;

  const [popupSuggestions] = useState(() =>
    [...CHAT_SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
  );

  useEffect(() => {
    if (mode === 'popup') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, mode]);

  const handleSend = (text) => {
    const t = (text !== undefined ? text : draft).trim();
    if (!t) return;
    onSendMessage(t);
    setDraft('');
    setShowConvList(false);
  };

  return (
    <div className={`chat-popup chat-popup--${mode}`}>
      {/* Header */}
      <div
        className="chat-popup-header"
        onClick={mode === 'mini' ? onMini : undefined}
        style={mode === 'mini' ? { cursor: 'pointer' } : undefined}
      >
        <div className="chat-popup-header-left">
          <span className="chat-popup-icon">✦</span>
          {mode === 'mini' ? (
            <span className="chat-popup-mini-label">
              {activeConv ? activeConv.title : 'WaveAI'}
            </span>
          ) : (
            <span className="chat-popup-conv-label">
              {activeConv ? activeConv.title : 'WaveAI'}
            </span>
          )}
        </div>
        <div className="chat-popup-header-actions" onClick={(e) => e.stopPropagation()}>
          {mode === 'popup' && (
            <button
              className={`chat-popup-action-btn${showConvList ? ' active' : ''}`}
              onClick={() => setShowConvList((v) => !v)}
              title="대화 목록"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <button className="chat-popup-action-btn" onClick={onMini} title={mode === 'mini' ? '팝업으로 열기' : '한 줄로 접기'}>
            {mode === 'mini' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
          <button className="chat-popup-action-btn" onClick={onExpand} title="전체 화면으로 열기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button className="chat-popup-action-btn" onClick={onClose} title="닫기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body — only when popup mode */}
      {mode === 'popup' && (
        <>
          {showConvList ? (
            <div className="chat-popup-conv-panel">
              <button
                className="chat-popup-conv-new"
                onClick={() => { onAddConv(); setShowConvList(false); }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                새 대화
              </button>
              <div className="chat-popup-conv-scroll">
                {conversations.length === 0 && (
                  <p className="chat-popup-conv-empty">대화 내역이 없습니다</p>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`chat-popup-conv-row${conv.id === activeConvId ? ' active' : ''}`}
                    onClick={() => { onSelectConv(conv.id); setShowConvList(false); }}
                  >
                    {conv.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="chat-popup-messages">
                {isNewChat ? (
                  <div className="chat-popup-welcome">
                    <p className="chat-popup-welcome-hint">무엇이든 물어보세요</p>
                    {popupSuggestions.map((s) => (
                      <button
                        key={s.label}
                        className="chat-popup-suggestion"
                        onClick={() => handleSend(s.prompt)}
                      >
                        <span className="chat-popup-suggestion-icon">{s.icon}</span>
                        <span>{s.prompt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="chat-popup-bubble-list">
                    {messages.map((msg, i) => (
                      <div key={i} className={`chat-popup-bubble-row ${msg.role}`}>
                        {msg.role === 'assistant' && (
                          <span className="chat-popup-avatar">✦</span>
                        )}
                        <div className={`chat-popup-bubble ${msg.role}`}>{msg.text}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="chat-popup-input-area">
                <form
                  className="chat-popup-input-form"
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                  <input
                    className="chat-popup-input"
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" className="chat-send-btn" disabled={!draft.trim()} aria-label="보내기">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const dailyMessage = {
  headline: '오늘도 잘 해내고 있어요',
  body: '어제 수면 점수는 84점으로, 입면까지 24분이 걸렸고 깊은 수면 비율은 전주 평균보다 8% 높았어요. 자세 점수는 78점으로, 오후 3시 이후 목이 앞으로 나오는 패턴이 반복되었으니 짧은 스트레칭으로 챙겨주세요. 오늘은 취침 1시간 전 조명을 낮추고, 50분 착석마다 1분 목 리셋 루틴을 실행해보세요!',
};

function HeartIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 8.5c0 4.5-8 10.5-8 10.5s-8-6-8-10.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8Z" />
    </svg>
  );
}

function Donut({ pct, r = 38, sw = 8, color = 'var(--wave)', bg = 'var(--wave-10)', children }) {
  const circ = 2 * Math.PI * r;
  const sz = (r + sw) * 2 + 4;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} className="-rotate-90" viewBox={`0 0 ${sz} ${sz}`}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={bg} strokeWidth={sw} />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function PostureScoreGauge({ score }) {
  const pct = score / 100;
  const cx = 100;
  const cy = 72;
  const r = 65;
  const ang = Math.PI * (1 - pct);
  const nx = cx + r * Math.cos(ang);
  const ny = cy - r * Math.sin(ang);
  const bgArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fgArc =
    pct <= 0
      ? ''
      : pct >= 1
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
      : `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`;
  const status = score > 80 ? '양호!' : score > 60 ? '주의' : '위험';
  const statusTone = score > 80 ? 'good' : score > 60 ? 'attention' : 'danger';
  const sparkles = [
    { x: 50, y: 32, s: 9 },
    { x: 152, y: 42, s: 7 },
    { x: 100, y: 6, s: 6 },
    { x: 66, y: 14, s: 5 },
    { x: 140, y: 16, s: 5 },
  ];

  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 200 78" className="mb-3 w-44 overflow-visible">
        <path d={bgArc} fill="none" stroke="var(--wave-20)" strokeWidth="11" strokeLinecap="round" />
        {fgArc && <path d={fgArc} fill="none" stroke="var(--wave)" strokeWidth="11" strokeLinecap="round" />}
        <circle cx={nx.toFixed(2)} cy={ny.toFixed(2)} r="7" fill="var(--surface)" stroke="var(--wave)" strokeWidth="3" />

        {sparkles.map((sp, i) => (
          <text key={i} x={sp.x} y={sp.y} fontSize={sp.s} fill="var(--wave)" textAnchor="middle" dominantBaseline="middle" opacity="0.8">
            ✦
          </text>
        ))}

        <circle cx={cx} cy={cy} r="30" fill="var(--wave)" />
        <circle cx={cx} cy={cy} r="30" fill="rgba(255,255,255,0.15)" />

        {score > 80 ? (
          <>
            <path d={`M ${cx - 13} ${cy - 8} Q ${cx - 9} ${cy - 13} ${cx - 5} ${cy - 8}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M ${cx + 5} ${cy - 8} Q ${cx + 9} ${cy - 13} ${cx + 13} ${cy - 8}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={cx - 9} cy={cy - 8} r="3.5" fill="var(--ink)" />
            <circle cx={cx + 9} cy={cy - 8} r="3.5" fill="var(--ink)" />
          </>
        )}

        {score > 80 ? (
          <path d={`M ${cx - 11} ${cy + 6} Q ${cx} ${cy + 17} ${cx + 11} ${cy + 6}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        ) : score > 60 ? (
          <line x1={cx - 11} y1={cy + 10} x2={cx + 11} y2={cy + 10} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d={`M ${cx - 11} ${cy + 10} Q ${cx} ${cy + 4} ${cx + 11} ${cy + 10}`} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>

      <p className={`posture-status-pill ${statusTone} mt-5`}>
        {status}
      </p>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--sub)' }}>
        자세 점수 <span className="font-bold" style={{ color: 'var(--ink)' }}>{score}점</span> / 100
      </p>
    </div>
  );
}

function MainPage({ onNavigate, todos, onToggleTodo, onGoToSleepSettings }) {
  const remaining = todos.filter((todo) => !todo.done).length;
  return (
    <div className="page-stack">
      <section className="hero card">
        <div>
          <h2>{dailyMessage.headline}</h2>
          <p>{dailyMessage.body}</p>
        </div>
      </section>

      <section className="main-grid">
        <Card title="현재 상태" >
          <div className="state-grid">
            <Metric label="실내 환경" value="쾌적" detail="온도 24℃ · 조도 낮음" />
            <Metric label="가전 제어 모드" value="집중 모드" detail="2시간 전 시작됨" />
            <Metric label="자세 점수" value="78점" detail="거북목 감지 오늘 4회" />
            <Metric label="레이더 연결 상태" value="연결됨" detail="방 1 레이더 기준" dot="online" />
          </div>
        </Card>

        <Card title="오늘 할일" action={`${remaining}개 남음`} onClick={() => onNavigate('weeklyPlan')}>
          <div className="todo-list">
            {todos.map((todo) => (
              <button
                type="button"
                className={`todo ${todo.done ? 'done' : ''}`}
                key={todo.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleTodo(todo.id);
                }}
              >
                <span className={todo.done ? 'checked' : ''}>{todo.done ? '✓' : ''}</span>
                <p>{todo.title}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card title="어젯밤 수면" onClick={() => onNavigate('sleep')}>
            <div className="flex items-center gap-12">
              <Donut pct={0.933} r={48} sw={11}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>7.0</span>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>/ 7.5 h</span>
                </div>
              </Donut>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-16">
                  <div>
                    <p className="mb-0.5 text-xs" style={{ color: 'var(--sub)' }}>달성</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>7.0</span>
                      <span className="text-sm" style={{ color: 'var(--sub)' }}>h</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--sub)' }}>오늘 달성량</p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs" style={{ color: 'var(--sub)' }}>목표</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold" style={{ color: 'var(--sub)' }}>7.5</span>
                      <span className="text-sm" style={{ color: 'var(--sub)' }}>h</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--sub)' }}>일일 목표</p>
                  </div>
                </div>
                <div className="border-t pt-2" style={{ borderColor: 'var(--wave-10)' }}>
                  <div className="flex items-center gap-16 text-xs">
                    <span className="w-16 shrink-0" style={{ color: 'var(--sub)' }}>입면 시간</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>23:42</span>
                  </div>
                  <div className="mt-1 flex items-center gap-16 text-xs">
                    <span className="w-16 shrink-0" style={{ color: 'var(--sub)' }}>기상 시간</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>06:42</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="자세 점수" onClick={() => onNavigate('posture')}>
            <PostureScoreGauge score={68} />
            <p className="mt-3 text-center text-base font-semibold" style={{ color: 'var(--ink)' }}>
              거북목 감지 오늘 <span style={{ color: 'var(--excellent-text)' }}>9회</span>
            </p>
            <p className="mt-0.5 text-center text-sm" style={{ color: 'var(--sub)' }}>전주 평균 7.3회 대비 개선</p>
            <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--wave-10)' }}>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>71%</p>
                  <p className="text-xs" style={{ color: 'var(--sub)' }}>바른 자세</p>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>62%</p>
                  <p className="text-xs" style={{ color: 'var(--sub)' }}>알림 수락</p>
                </div>
              </div>
            </div>
          </Card>

          <button type="button" className="promo-card navy w-full cursor-pointer border-0 text-left" onClick={() => onNavigate('sleep')}>
            <strong>취침 가이드</strong>
            <p>가장 상쾌하게 깨어날 수 있는 취침 시간을 추천받아보세요.</p>
          </button>

          <button type="button" className="promo-card plum w-full cursor-pointer border-0 text-left" onClick={onGoToSleepSettings}>
            <strong>수면 환경</strong>
            <p>최적의 수면 환경을 만드는 방법을 알아보세요.</p>
          </button>
        </div>
      </section>
    </div>
  );
}

function OverviewPage({ onNavigate }) {
  const [bannerIndex, setBannerIndex] = useState(0);

  return (
    <div className="page-stack">
      <section className="hero card overview-banner">
        <div>
          <h2>오늘도 좋은 하루예요</h2>
          <p>{overviewBanners[bannerIndex]}</p>
        </div>
        <div className="overview-banner-dots">
          {overviewBanners.map((_, index) => (
            <button
              type="button"
              key={index}
              className={index === bannerIndex ? 'active' : ''}
              aria-label={`메시지 ${index + 1}`}
              onClick={() => setBannerIndex(index)}
            />
          ))}
        </div>
      </section>

      <section className="overview-score-row">
        <Card title="에너지 점수" action="Good">
          <div className="overview-score-number">
            77<small>점</small>
          </div>
          <BarChart data={energyWeekBars} />
        </Card>

        <Card title="활동 링">
          <div className="activity-rings">
            <i className="ring-outer" />
            <i className="ring-mid" />
            <i className="ring-inner" />
          </div>
        </Card>

        <Card title="수면 점수" action="Good" onClick={() => onNavigate('sleep')}>
          <SemiGauge value={75} max={100} label="75점" />
        </Card>
      </section>

      <section className="overview-tile-row">
        <button type="button" className="feature-tile orange" onClick={() => {}}>
          <strong>식사 기록</strong>
          <span>첫 식사를 기록할 준비가 되셨나요?</span>
        </button>

        <div className="overview-quick-grid">
          {overviewQuickActions.map((item) => (
            <button type="button" className={`overview-quick-item ${item.tone}`} key={item.label}>
              {item.label}
            </button>
          ))}
        </div>

        <button type="button" className="feature-tile purple" onClick={() => {}}>
          <strong>심장 건강</strong>
          <span>심장 건강 점수와 주요 인사이트를 한 곳에서 확인하세요.</span>
        </button>
      </section>

      <section className="overview-tile-row">
        {overviewFeatureTiles.map((tile) => (
          <button type="button" className={`feature-tile ${tile.tone} ${tile.muted ? 'muted' : ''}`} key={tile.id}>
            <strong>{tile.title}</strong>
            <span>{tile.desc}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

function SleepPage({ tab, setTab, onGoToSleepSettings }) {
  return (
    <div className="page-stack">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          ['current', '오늘의 수면준비'],
          ['report', '수면 리포트'],
        ]}
      />
      {tab === 'current' && (
        <div className="dashboard-grid">
          <Card title="오늘 밤 수면 계획">
            <div className="sleep-plan">
              <strong>23:30 → 06:40</strong>
              <span>목표 수면 7시간 10분</span>
              <div className="sleep-plan-row">
                <p>취침 준비</p>
                <b>22:50</b>
              </div>
              <div className="sleep-plan-row">
                <p>조명 낮춤</p>
                <b>23:00</b>
              </div>
              <div className="sleep-plan-row">
                <p>권장 실내 온도</p>
                <b>24℃</b>
              </div>
            </div>
            <button type="button" className="sleep-plan-settings-btn" onClick={onGoToSleepSettings}>
              수면 설정 바로가기
            </button>
          </Card>
          <Card title="야간 스마트폰 사용 관리">
            <div className="phone-care">
              <div>
                <strong>18분</strong>
                <span>어젯밤 취침 전 사용</span>
              </div>
              <InfoList
                items={[
                  ['차단 시작', '23:00 이후 알림 최소화'],
                  ['권장 액션', '취침 40분 전 충전 스테이션에 두기'],
                  ['오늘 목표', '취침 전 사용 10분 이하'],
                ]}
              />
            </div>
          </Card>

          {sleepSettingSummaries.map((item) => (
            <Card key={item.title} title={item.title} action="적용 중" onClick={onGoToSleepSettings}>
              <p className="report-summary-only">{item.text}</p>
            </Card>
          ))}
        </div>
      )}
      {tab === 'report' && (
        <>
          <SleepDailyReport />
          <SleepWeeklyReport />
        </>
      )}
    </div>
  );
}

function WakeAlarmRow({ title, time, on, onToggle }) {
  return (
    <div className="wake-alarm-row">
      <div>
        <strong>{title}</strong>
        <span>{time}</span>
      </div>
      <button type="button" className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} aria-label={`${title} 토글`}>
        <i />
      </button>
    </div>
  );
}

function SleepHypnogram({ segments, timeLabels }) {
  const total = segments.reduce((sum, seg) => sum + seg.minutes, 0);

  let cursor = 0;
  const points = segments.map((seg) => {
    const x0 = cursor;
    cursor += seg.minutes;
    return { ...seg, x0, x1: cursor, y: HYPNOGRAM_LANES[seg.stage] };
  });

  return (
    <div>
      <div className="relative h-24 w-full">
        {Object.values(HYPNOGRAM_LANES).map((y) => (
          <div key={y} className="absolute inset-x-0 border-t border-[var(--line)]" style={{ top: `${y}%` }} />
        ))}
        {points.map((seg, index) => {
          const prev = points[index - 1];
          const topY = prev ? Math.min(prev.y, seg.y) : seg.y;
          const bottomY = prev ? Math.max(prev.y, seg.y) : seg.y;
          const topColor = prev && prev.y > seg.y ? stageColorVar[seg.stage] : prev && stageColorVar[prev.stage];
          const bottomColor = prev && prev.y > seg.y ? stageColorVar[prev.stage] : prev && stageColorVar[seg.stage];

          return (
            <div key={index}>
              {prev && (
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${(seg.x0 / total) * 100}%`,
                    top: `${topY}%`,
                    height: `${bottomY - topY}%`,
                    width: HYPNOGRAM_BAND_PX,
                    transform: 'translateX(-50%)',
                    background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
                  }}
                />
              )}
              <div
                className="absolute rounded-full"
                style={{
                  left: `${(seg.x0 / total) * 100}%`,
                  width: `${((seg.x1 - seg.x0) / total) * 100}%`,
                  top: `${seg.y}%`,
                  height: HYPNOGRAM_BAND_PX,
                  transform: 'translateY(-50%)',
                  background: stageColorVar[seg.stage],
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-[var(--line)] pt-2">
        <p className="mb-1.5 text-[11px] font-bold text-[var(--sub)]">움직임</p>
        <div className="flex h-3 w-full items-end justify-between">
          {movementTicks.map((height, index) => (
            <div
              key={index}
              className="w-px rounded-sm bg-[var(--neutral-dot)]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between border-t border-[var(--line)] pt-2 text-[11px] text-[var(--sub)]">
        {timeLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-[var(--sub)]">
        <span className="inline-block h-2.5 w-4 rounded-sm bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]" />
        일반적인 범위
      </div>
    </div>
  );
}

function SleepStageBreakdownRow({ stage }) {
  const [typicalStart, typicalEnd] = stage.typical;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: stageColorVar[stage.tone] }} />
        <strong className="text-[13px] font-extrabold text-[var(--ink)]">{stage.label}</strong>
        <em className="font-extrabold not-italic text-[var(--sub)]">{stage.pct}%</em>
        <small className="ml-auto text-[var(--sub)]">{stage.time}</small>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]"
          style={{ left: `${typicalStart}%`, width: `${typicalEnd - typicalStart}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${stage.pct}%`, background: stageColorVar[stage.tone] }}
        />
      </div>
    </div>
  );
}

let insightIdCounter = 0;
function withInsightIds(items) {
  return items.map(([label, title, text]) => ({ id: ++insightIdCounter, label, title, text }));
}

const sleepDailyInsights = withInsightIds([
  ['오늘의 권장 액션', '에어컨 예약을 새벽 4시까지 1시간 연장', '최근 3일 동안 방 온도가 26℃를 넘으면 뒤척임이 눈에 띄게 늘었어요. 에어컨 예약을 새벽 4시까지 1시간 늘려볼게요.'],
  ['취침 전 루틴', '23:00 스마트폰 차단 · 23:20 조도 낮춤 · 23:30 취침', '화면을 오래 보면 수면 부채가 쌓이기 쉬워요. 23:00엔 스마트폰을 멀리하고 23:20엔 조명을 낮춘 뒤 23:30에 잠들어보세요.'],
  ['자동화 제안', '기상 30분 전 조명 20% → 60%로 서서히 상승', '심박이 안정적으로 올라오는 구간에 맞춰 빛을 천천히 늘리면 더 가볍게 깰 수 있어요.'],
]);

function SleepDailyReport() {
  return (
    <CareReport
      type="daily"
      header={<SleepStatusReport />}
      analysis={[
        ['수면 점수', '82점', '전일 대비 +4점'],
        ['총 수면 시간', '6h 52m', '목표 7h 30m 대비 -38분'],
        ['입면 시간', '27분', '스마트폰 사용 후 지연'],
        ['뒤척임 집중 시간', '03:05~03:40', '온도 26℃ 이상 구간'],
        ['수면 부채', '2h 10m', '이번 주 안에 회복 권장'],
      ]}
      insights={sleepDailyInsights}
    />
  );
}

function weeklyScoreStatus(value) {
  return value >= 85 ? '좋음' : value >= 78 ? '보통 이상' : '관리 필요';
}

function weeklyHoursColor(hours) {
  return hours >= 7 ? 'var(--wave)' : hours >= 6 ? 'var(--wave-40)' : 'var(--wave-20)';
}

function postureScoreColor(score) {
  return score >= 85 ? 'var(--wave)' : score >= 78 ? 'var(--wave-40)' : 'var(--wave-20)';
}

function WeeklyTrendSummary({ trendData, valueKey = 'hours', unit = 'h', label = '7일 평균 수면 시간', goal = 7.5, decimals = 1 }) {
  const avgValue = trendData.reduce((sum, d) => sum + d[valueKey], 0) / trendData.length;
  const goalPercent = Math.round((avgValue / goal) * 100);

  return (
    <div className="mb-2 mt-3 flex flex-wrap items-baseline gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--sub)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{avgValue.toFixed(decimals)}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--sub)' }}>{unit}</span>
      <span className="block w-full text-xs" style={{ color: 'var(--sub)' }}>
        목표 {goal}{unit} 대비 <span className="font-bold" style={{ color: 'var(--ink)' }}>{goalPercent}%</span>
      </span>
    </div>
  );
}

function WeeklyTrendTooltip({ active, payload, valueKey = 'hours', unit = 'h', valueLabel = '수면', scoreKey = 'score' }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const score = point[scoreKey];

  return (
    <div className="rounded-lg border bg-[var(--surface)] px-3 py-2 text-xs shadow-md" style={{ borderColor: 'var(--wave-20)' }}>
      <p className="font-extrabold" style={{ color: 'var(--ink)' }}>{point.day}</p>
      <p style={{ color: 'var(--ink)' }}>{valueLabel}: {point[valueKey]}{unit}</p>
      {score !== undefined && score !== point[valueKey] && <p style={{ color: 'var(--ink)' }}>점수: {score}점</p>}
      {score !== undefined && <p style={{ color: 'var(--sub)' }}>{weeklyScoreStatus(score)}</p>}
    </div>
  );
}

function PostureScoreTooltip({ active, payload, xKey, valueKey, noteKey }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border bg-[var(--surface)] px-3 py-2 text-xs shadow-md" style={{ borderColor: 'var(--wave-20)' }}>
      <p className="font-extrabold" style={{ color: 'var(--ink)' }}>
        {point[xKey]}{point.label ? ` · ${point.label}` : ''}
      </p>
      <p style={{ color: 'var(--ink)' }}>자세 점수: {point[valueKey]}점</p>
      {noteKey && point[noteKey] !== undefined && <p style={{ color: 'var(--ink)' }}>거북목 {point[noteKey]}회</p>}
      <p style={{ color: 'var(--sub)' }}>{weeklyScoreStatus(point[valueKey])}</p>
    </div>
  );
}

function PostureScoreChart({ data, xKey, valueKey = 'value', noteKey }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <RechartsBarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<PostureScoreTooltip xKey={xKey} valueKey={valueKey} noteKey={noteKey} />} cursor={{ fill: 'var(--wave-10)' }} />
        <Bar dataKey={valueKey} radius={[8, 8, 0, 0]} maxBarSize={36}>
          <LabelList dataKey={valueKey} position="top" formatter={(value) => `${value}점`} style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 700 }} />
          {data.map((d) => (
            <Cell key={d[xKey]} fill={postureScoreColor(d[valueKey])} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function InsightCard({ id, label, title, text }) {
  const { approved, toggle } = useApprovedActions();
  const isApproved = !!approved[id];

  return (
    <div className={`insight-card ${isApproved ? 'applied' : ''}`}>
      <span className="insight-card-label">{label}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      <button type="button" className="insight-card-action" onClick={() => toggle(id)}>
        {isApproved ? '✓ 적용됨' : '실행'}
      </button>
    </div>
  );
}

function CareReport({
  type,
  title,
  score,
  summary,
  analysis,
  insights,
  visual,
  visualAction = 'Graph',
  trendData,
  trendValueKey = 'hours',
  trendUnit = 'h',
  trendDomain = [0, 9],
  trendSummaryLabel = '7일 평균 수면 시간',
  trendGoal = 7.5,
  trendDecimals = 1,
  trendColorFn = weeklyHoursColor,
  trendTooltipLabel = '수면',
  showTrendSummary = true,
  averageScore,
  dateNav,
  extra,
  header,
}) {
  const isWeekly = type === 'weekly';

  return (
    <div className="care-report-layout">
      {header || (
        <>
          {dateNav}
          {visual && (
            <Card title={title} action={visualAction} wide>
              <p className="report-summary-only">{summary}</p>
              {visual}
            </Card>
          )}
          {extra}
        </>
      )}
      {isWeekly && (
        <Card title={title} wide>
          <p className="report-summary-only">{summary}</p>
          {showTrendSummary && (
            <WeeklyTrendSummary
              trendData={trendData}
              valueKey={trendValueKey}
              unit={trendUnit}
              label={trendSummaryLabel}
              goal={trendGoal}
              decimals={trendDecimals}
            />
          )}
          <div className="weekly-score-chart">
            <div className="weekly-trend-chart">
              <ResponsiveContainer width="100%" height={210}>
                <RechartsBarChart data={trendData} margin={{ top: 16, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={trendDomain} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<WeeklyTrendTooltip valueKey={trendValueKey} unit={trendUnit} valueLabel={trendTooltipLabel} />}
                    cursor={{ fill: 'var(--wave-10)' }}
                  />
                  <Bar dataKey={trendValueKey} radius={[8, 8, 0, 0]} maxBarSize={36}>
                    <LabelList
                      dataKey={trendValueKey}
                      position="top"
                      formatter={(value) => `${value}${trendUnit}`}
                      style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 700 }}
                    />
                    {trendData.map((d) => (
                      <Cell key={d.day} fill={trendColorFn(d[trendValueKey])} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div className="weekly-score-average">
              <span>평균 점수</span>
              <strong>{averageScore || score}</strong>
              <p>7일 점수 기준</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="인사이트">
        <div className="care-analysis-grid">
          {analysis.map(([label, value, detail]) => (
            <Metric key={label} label={label} value={value} detail={detail} />
          ))}
        </div>
      </Card>

      <Card title="권장 액션">
        <div className="insight-list">
          {insights.map((item) => (
            <InsightCard key={item.id} id={item.id} label={item.label} title={item.title} text={item.text} />
          ))}
        </div>
      </Card>
    </div>
  );
}

const sleepWeeklyScores = [
  ['월', 74],
  ['화', 76],
  ['수', 79],
  ['목', 80],
  ['금', 82],
  ['토', 87],
  ['일', 89],
];

const sleepWeeklyTrendData = sleepTrend.map((item, index) => ({
  day: item.day,
  hours: item.value,
  score: sleepWeeklyScores[index][1],
}));

const sleepWeeklyInsights = withInsightIds([
  ['다음 주 목표', '평일 23:30 이전 취침 4회 달성', '주말 회복 수면에 의존하지 않도록 평일 수면 총량을 먼저 올려야 합니다.'],
  ['수면 부채 회복 플랜', '월~목 20분씩 추가 수면, 금요일은 7시간 30분 확보', '한 번에 몰아서 자는 것보다 평일에 조금씩 갚는 쪽이 리듬 유지에 유리합니다.'],
  ['환경 자동화', '새벽 1시~4시 냉방 유지, 기상 30분 전 조명 알람', '온도와 기상 리듬을 같이 고정하면 뒤척임과 수면 관성을 줄일 가능성이 큽니다.'],
]);

function SleepWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score="81점"
      summary="평균 수면 시간은 줄었지만, 기상 규칙성과 깊은 수면 비율은 후반으로 갈수록 개선되었습니다."
      trendData={sleepWeeklyTrendData}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→89점', '주 후반 회복세'],
        ['총합 수면 시간', '46.8h', '전주 대비 18% 감소'],
        ['수면 부채', '2h 10m', '평일 누적 부족'],
        ['온도 민감 구간', '3회', '26℃ 이상에서 뒤척임 증가'],
        ['기상 규칙성', '82%', '전주 대비 +6%'],
      ]}
      insights={sleepWeeklyInsights}
    />
  );
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function formatStatusDateLabel(date, latestDate) {
  if (isSameDay(date, latestDate)) return '오늘';
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

function getToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function CalendarPopup({ selectedDate, latestDate, onSelect }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [...Array(startWeekday).fill(null), ...Array(daysInMonth).keys()].map((d) =>
    d === null ? null : d + 1
  );

  return (
    <div className="calendar-popup">
      <div className="calendar-popup-head">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="이전 달">
          ‹
        </button>
        <strong>{year}년 {month + 1}월</strong>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="calendar-popup-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-popup-grid">
        {cells.map((d, index) => {
          if (d === null) return <span key={`blank-${index}`} />;
          const cellDate = new Date(year, month, d);
          const isSelected = isSameDay(cellDate, selectedDate);
          const isDisabled = cellDate > latestDate;
          return (
            <button
              type="button"
              key={d}
              className={isSelected ? 'selected' : ''}
              disabled={isDisabled}
              onClick={() => onSelect(cellDate)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusDateNavigator({ date, latestDate, onChange }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const shiftDay = (delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onChange(next);
  };

  return (
    <div className="date-navigator">
      <button type="button" onClick={() => shiftDay(-1)} aria-label="이전 날">‹</button>
      <button type="button" className="date-navigator-label" onClick={() => setShowCalendar((value) => !value)}>
        {formatStatusDateLabel(date, latestDate)}
      </button>
      <button type="button" onClick={() => shiftDay(1)} aria-label="다음 날" disabled={isSameDay(date, latestDate)}>
        ›
      </button>
      {showCalendar && (
        <CalendarPopup
          selectedDate={date}
          latestDate={latestDate}
          onSelect={(value) => {
            onChange(value);
            setShowCalendar(false);
          }}
        />
      )}
    </div>
  );
}

function SleepStatusReport() {
  const [reportDate, setReportDate] = useState(getToday);
  const [latestDate] = useState(getToday);
  const [showFactors, setShowFactors] = useState(false);
  const [showStages, setShowStages] = useState(false);

  return (
    <>
      <StatusDateNavigator date={reportDate} latestDate={latestDate} onChange={setReportDate} />

      <section className="sleep-score-hero">
        <div className="sleep-score-hero-top">
          <div className="sleep-score-hero-number">
            75<span className="tag good">Good</span>
          </div>
          <button type="button" className="sleep-score-details-btn" onClick={() => setShowFactors((current) => !current)}>
            {showFactors ? '접기' : '상세 보기'}
          </button>
        </div>
        <div className="sleep-score-hero-times">
          <strong>6시간 25분</strong>
          <span>수면 시간 · 2:11 AM - 8:36 AM</span>
        </div>
        <div className="sleep-score-hero-actual">
          <strong>5시간 36분</strong>
          <span>실제 수면 시간</span>
        </div>
      </section>

      {showFactors && (
        <Card title="수면 점수 요인">
          <div className="factor-grid">
            {sleepScoreFactors.map((factor) => (
              <div className={`factor-card ${factor.tone}`} key={factor.label}>
                <span>{factor.label}</span>
                <strong>{factor.value}</strong>
                <em className={`factor-tag ${factor.tone}`}>{factor.tag}</em>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="수면 단계"
        action={
          <button type="button" className="card-action-btn" onClick={() => setShowStages((current) => !current)}>
            {showStages ? '접기' : '상세 보기'}
          </button>
        }
      >
        <SleepHypnogram segments={sleepHypnogramSegments} timeLabels={hypnogramTimeLabels} />
        {showStages && (
          <div className="mt-6 flex flex-col gap-4">
            {sleepStageBreakdown.map((stage) => (
              <SleepStageBreakdownRow stage={stage} key={stage.label} />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card title="혈중 산소" action="평균 96%">
          <ResponsiveContainer width="100%" height={140}>
            <RechartsAreaChart data={spo2Trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="spo2Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[88, 100]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                formatter={(value) => [`${value}%`, '혈중 산소']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#spo2Fill)" dot={{ fill: 'var(--wave)', r: 3, strokeWidth: 0 }} />
            </RechartsAreaChart>
          </ResponsiveContainer>
          <p className="section-description">90% 미만 지속 시간: 0초</p>
        </Card>

        <Card title="코골이" action={`${snoringEpisodes.length}회 감지`}>
          <div className="big-number">
            {snoringEpisodes.reduce((sum, item) => sum + item.duration, 0)}<span>분</span>
            <small>오늘 밤 총 코골이 시간</small>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {snoringEpisodes.map((item) => (
              <div key={item.time} className="flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--wave-05)' }}>
                <span style={{ color: 'var(--sub)' }}>{item.time}</span>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>{item.duration}분</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="심박수" action="평균 61bpm">
          <ResponsiveContainer width="100%" height={140}>
            <RechartsAreaChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.heart }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="heartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[45, 85]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                formatter={(value) => [`${value} bpm`, '심박']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#heartFill)" dot={{ fill: 'var(--wave)', r: 3, strokeWidth: 0 }} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="호흡수" action="평균 14.0회/분">
          <ResponsiveContainer width="100%" height={140}>
            <RechartsAreaChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.breath }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="breathFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[8, 22]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                formatter={(value) => [`${value}회/분`, '호흡']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#breathFill)" dot={{ fill: 'var(--wave)', r: 3, strokeWidth: 0 }} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}

function PosturePage({ tab, setTab }) {
  const [postureAlerts, setPostureAlerts] = useState({
    turtleNeck: true,
    waistTilt: true,
    longSitting: false,
  });
  const togglePostureAlert = (key) => {
    setPostureAlerts((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="page-stack">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          ['current', '현재 상태'],
          ['daily', '일간 리포트'],
          ['weekly', '주간 리포트'],
        ]}
      />
      {tab === 'current' && (
        <div className="dashboard-grid">
          <Card title="현재 자세상태">
            <div className="gesture-placeholder mb-4 rounded-2xl">
              <span>사진 없음</span>
            </div>
            <InfoList
              items={[
                ['현재 감지된 자세', '목이 앞으로 12도 나옴'],
                ['현재 자세 피드백', '턱을 살짝 당기고 어깨를 뒤로 열어주세요'],
              ]}
            />
          </Card>
          <Card title="오늘의 자세 점수">
            <div className="flex justify-center">
              <Donut pct={0.78} r={48} sw={11}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>78</span>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>점</span>
                </div>
              </Donut>
            </div>
            <div className="split-stats">
              <Metric label="바른자세" value="71%" detail="목표 80%" />
              <Metric label="알림 수락" value="62%" detail="전주 대비 개선" />
            </div>
          </Card>
          <Card title="오늘 누적 착석 시간">
            <div className="sitting-time">
              <strong>5h 20m</strong>
              <span>권장 최대 연속 착석 90분</span>
              <div>
                <i style={{ width: '68%' }} />
              </div>
              <p>가장 긴 연속 착석은 1시간 48분입니다.</p>
            </div>
          </Card>
          <Card title="자세 무너짐 알림" action="ON/OFF">
            <div className="posture-alert-list">
              <PostureAlertRow
                title="거북목"
                desc="목 전방 기울어짐 감지 시 알림"
                on={postureAlerts.turtleNeck}
                onToggle={() => togglePostureAlert('turtleNeck')}
              />
              <PostureAlertRow
                title="허리 기울어짐"
                desc="좌우 기울어짐이 반복될 때 알림"
                on={postureAlerts.waistTilt}
                onToggle={() => togglePostureAlert('waistTilt')}
              />
              <PostureAlertRow
                title="장시간 착석"
                desc="90분 이상 연속 착석 시 휴식 제안"
                on={postureAlerts.longSitting}
                onToggle={() => togglePostureAlert('longSitting')}
              />
            </div>
          </Card>
          <Card title="오늘의 시간대별 자세 점수" wide>
            <p className="mb-3 text-sm" style={{ color: 'var(--sub)' }}>시간대별 자세 점수 변화 (시간 · 점)</p>
            <PostureScoreChart data={postureBars} xKey="label" valueKey="value" noteKey="turtleNeck" />
          </Card>
        </div>
      )}
      {tab === 'daily' && (
        <PostureDailyReport />
      )}
      {tab === 'weekly' && (
        <PostureWeeklyReport />
      )}
    </div>
  );
}

const postureDailyInsights = withInsightIds([
  ['오늘의 권장 액션', '50분마다 목 스트레칭, 오후 3시 전 모니터 높이 재확인', '목이 먼저 무너지는 날은 허리를 펴기보다 시선 높이를 먼저 맞추는 편이 좋습니다.'],
  ['추천 루틴', '턱 당기기 20초 · 어깨 열기 20초 · 1분 기지개', '장시간 움직임이 없을 때는 자세 교정보다 짧은 휴식 제안이 우선입니다.'],
  ['알림 조정', '거북목은 8분 지속 시 음성 안내, 허리는 반복 3회부터 안내', '가벼운 흔들림은 대시보드 알림으로 두고 반복 패턴만 음성으로 올리는 구성이 적절합니다.'],
  ['추천 루틴', '45분마다 기지개 알림', '오후 3시~5시에는 집중도가 높아질수록 고개가 앞으로 나오는 패턴이 반복되었습니다. 45분마다 기지개 알림을 받아 목과 허리 자세를 함께 리셋해보세요.'],
]);

function PostureDailyReport() {
  return (
    <CareReport
      type="daily"
      title="어제의 자세 리포트"
      score="82점"
      summary="오래 앉아 있을수록 허리보다 목 자세가 먼저 무너지는 패턴이 반복되었습니다."
      visual={<PostureScoreChart data={postureLog} xKey="time" valueKey="score" />}
      visualAction={null}
      analysis={[
        ['자세 점수', '82점', '어제보다 6점 상승'],
        ['책상 앞 체류 시간', '5h 20m', '오후 업무 구간 집중'],
        ['바른 자세 유지', '62%', '목표 70%까지 8%p 부족'],
        ['거북목 위험 시간', '48분', '3단계 알림 전 1회 회복'],
        ['허리 굽음 시간', '1h 10m', '골반 세우기 피드백 필요'],
        ['가장 무너진 시간대', '15:00~17:00', '목 전방 자세 반복'],
      ]}
      insights={postureDailyInsights}
    />
  );
}

const postureWeeklyInsights = withInsightIds([
  ['다음 주 목표', '50분 착석 후 1분 휴식 4회, 오후 3시 이후 거북목 20% 감소', '가장 무너지는 시간대가 고정되어 있어 선제 알림을 앞당기는 편이 좋습니다.'],
  ['추천 루틴', '허리 리셋 하루 2회 · 목 리셋 하루 2회 · 1분 걷기', '허리 굽음은 증가했으므로 목 교정 루틴과 별도로 골반 세우기 루틴을 추가하세요.'],
  ['알림 전략', '1단계는 화면 표시, 2단계부터 음성 안내, 3단계는 휴식 제안', '계속 교정만 요구하면 피로도가 커지므로 장시간 무움직임에는 휴식 제안이 더 적합합니다.'],
  ['추천 루틴', '45분마다 기지개 알림', '허리 굽음 빈도가 9% 늘었어요. 목 지표는 좋아졌지만 골반이 무너지며 허리가 말리는 보상 패턴이 생겼으니, 45분마다 기지개 알림으로 허리도 함께 챙겨보세요.'],
  ['다음 주 체크포인트', '휴식 루틴 수행률 64% → 80%', '루틴 수행률이 올라가면 장시간 착석 알림과 거북목 지속 시간이 함께 줄 가능성이 높습니다.'],
]);

const postureWeeklyTrendData = [
  { day: '월', score: 74 },
  { day: '화', score: 76 },
  { day: '수', score: 78 },
  { day: '목', score: 80 },
  { day: '금', score: 81 },
  { day: '토', score: 86 },
  { day: '일', score: 92 },
];

function PostureWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 자세 리포트"
      score="81점"
      summary="자세 점수는 상승했지만 허리 굽음 빈도는 늘어, 목 리셋과 허리 리셋을 분리해서 관리해야 합니다."
      trendData={postureWeeklyTrendData}
      trendValueKey="score"
      trendUnit="점"
      trendDomain={[0, 100]}
      trendColorFn={postureScoreColor}
      trendTooltipLabel="자세 점수"
      showTrendSummary={false}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→81점', '주간 평균 기준 개선'],
        ['거북목 지속 시간', '18% 감소', '목 리셋 알림 반응 개선'],
        ['허리 굽음 빈도', '9% 증가', '오후 착석 후반부 집중'],
        ['휴식 루틴 수행률', '64%', '목표 80%까지 16%p 부족'],
        ['장시간 착석 알림', '7회', '50분 이상 같은 자세 유지'],
      ]}
      insights={postureWeeklyInsights}
    />
  );
}

const allRecommendedActions = [
  ...sleepDailyInsights,
  ...sleepWeeklyInsights,
  ...postureDailyInsights,
  ...postureWeeklyInsights,
];

const weeklyPlanCategories = ['자세', '수면', '식습관', '멘탈'];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return koreanWeekdayLabels.slice(1).concat(koreanWeekdayLabels[0]).map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label, date: date.getDate(), isToday: date.toDateString() === today.toDateString() };
  });
}

function RecommendedActionRow({ item, approved }) {
  const { toggle } = useApprovedActions();

  return (
    <div className={`insight-card ${approved ? 'applied' : ''}`}>
      <span className="insight-card-label">{item.label}</span>
      <strong>{item.title}</strong>
      <p>{item.text}</p>
      <button type="button" className="insight-card-action" onClick={() => toggle(item.id)}>
        {approved ? '✓ 적용됨' : '승인'}
      </button>
    </div>
  );
}

function WeeklyPlanPage({ todos, onToggleTodo, onAddTodo }) {
  const weekDates = useMemo(getWeekDates, []);
  const { approved } = useApprovedActions();
  const [modalOpen, setModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCat, setDraftCat] = useState('자세');

  const approvedItems = allRecommendedActions.filter((item) => approved[item.id]);
  const pendingItems = allRecommendedActions.filter((item) => !approved[item.id]);

  const submitNewTask = () => {
    if (!draftTitle.trim()) return;
    onAddTodo(draftTitle.trim(), todayWeekdayLabel, draftCat);
    setDraftTitle('');
    setModalOpen(false);
  };

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>주간 건강 계획</h2>
          <p className="text-xs" style={{ color: 'var(--sub)' }}>
            {weekDates[0].label} {weekDates[0].date}일 ~ {weekDates[6].label} {weekDates[6].date}일
          </p>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:w-auto"
          style={{ background: 'var(--wave)', color: 'var(--ink)' }}
          onClick={() => setModalOpen(true)}
        >
          + 계획 추가
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="p-3 text-xs font-semibold" style={{ color: 'var(--sub)' }}>구분</div>
              {weekDates.map((d) => (
                <div key={d.label} className="px-1 py-2 text-center" style={{ background: d.isToday ? 'var(--wave-05)' : undefined }}>
                  <p className="text-[10px] font-medium" style={{ color: d.isToday ? 'var(--excellent-text)' : 'var(--sub)' }}>{d.label}</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: d.isToday ? 'var(--ink)' : 'var(--sub)' }}>{d.date}</p>
                </div>
              ))}
            </div>
            {weeklyPlanCategories.map((cat) => (
              <div key={cat} className="grid grid-cols-8 border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center p-2">
                  <span className="status-chip">{cat}</span>
                </div>
                {weekDates.map((d) => {
                  const items = todos.filter((t) => t.day === d.label && t.cat === cat);
                  return (
                    <div key={d.label} className="min-h-[52px] p-1.5" style={{ background: d.isToday ? 'var(--wave-05)' : undefined }}>
                      {items.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => onToggleTodo(t.id)}
                          className="mb-1 w-full rounded-lg px-1.5 py-1 text-left text-[10px] leading-snug"
                          style={{
                            background: t.done ? 'var(--wave-20)' : 'var(--wave-10)',
                            color: 'var(--ink)',
                            opacity: t.done ? 0.6 : 1,
                            textDecoration: t.done ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card title="오늘의 할일" action={`${todos.filter((t) => t.done).length}/${todos.length} 완료`}>
          <div className="flex flex-col gap-1">
            {todos.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => onToggleTodo(t.id)}
                className="flex items-center gap-3 rounded-xl p-2.5 text-left"
                style={{ background: 'var(--wave-05)' }}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border-2"
                  style={{ borderColor: t.done ? 'var(--wave)' : 'var(--wave-20)', background: t.done ? 'var(--wave)' : 'transparent' }}
                />
                <span className={`min-w-0 flex-1 truncate text-sm ${t.done ? 'line-through' : ''}`} style={{ color: t.done ? 'var(--sub)' : 'var(--ink)' }}>
                  {t.title}
                </span>
                <span className="status-chip shrink-0">{t.cat}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="AI 맞춤 추천 계획">
          <p className="section-description">최근 수면, 자세, 환경 데이터를 분석해 오늘 도움이 될 행동을 맞춤으로 추천해드려요.</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold" style={{ color: 'var(--good-text)' }}>승인됨 ({approvedItems.length})</p>
              {approvedItems.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--sub)' }}>아직 승인한 권장 액션이 없어요.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {approvedItems.map((item) => (
                    <RecommendedActionRow key={item.id} item={item} approved />
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold" style={{ color: 'var(--sub)' }}>승인 대기 ({pendingItems.length})</p>
              <div className="flex flex-col gap-2">
                {pendingItems.map((item) => (
                  <RecommendedActionRow key={item.id} item={item} approved={false} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setModalOpen(false)}>
          <div className="w-[90vw] max-w-80 rounded-2xl p-6 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>새 계획 추가 · {todayWeekdayLabel}요일</p>
              <button type="button" onClick={() => setModalOpen(false)} style={{ color: 'var(--sub)' }}>✕</button>
            </div>
            <input
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="계획 내용을 입력하세요"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ border: '1.5px solid var(--line)', background: 'var(--wave-05)' }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitNewTask();
              }}
            />
            <select
              value={draftCat}
              onChange={(event) => setDraftCat(event.target.value)}
              className="mt-2 w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1.5px solid var(--line)' }}
            >
              {weeklyPlanCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={submitNewTask}
              className="mt-3 w-full rounded-xl py-2 text-sm font-semibold"
              style={{ background: 'var(--wave)', color: 'var(--ink)' }}
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostureAlertRow({ title, desc, on, onToggle }) {
  return (
    <div className="posture-alert-row">
      <div>
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
      <button type="button" className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} aria-label={`${title} 알림 토글`}>
        <i />
      </button>
    </div>
  );
}

function HomeControlPage() {
  const [tab, setTab] = useState('history');
  const [selectedSetId, setSelectedSetId] = useState('daily');
  const [activeSetId, setActiveSetId] = useState('daily');
  const [selectedDeviceId, setSelectedDeviceId] = useState('light');
  const [openControl, setOpenControl] = useState('');
  const [bindings, setBindings] = useState({});
  const selectedSet = gestureSets.find((set) => set.id === selectedSetId) || gestureSets[0];
  const activeSet = gestureSets.find((set) => set.id === activeSetId) || gestureSets[0];
  const selectedDevice = iotDevices.find((device) => device.id === selectedDeviceId) || iotDevices[0];
  const onlineCount = iotDevices.filter((device) => device.connection === 'online').length;
  const activeGestures = activeSet.gestures.map((gesture) => ({ ...gesture, setName: activeSet.name }));
  const selectedDeviceBindings = Object.entries(bindings).filter(([key]) => key.startsWith(`${selectedDevice.id}:`));
  const displayedBinding = selectedDeviceBindings.length > 0
    ? `${selectedDeviceBindings.length}개 매핑됨`
    : '전체 미지정';
  const usedGestureIds = new Set(Object.values(bindings).map((binding) => binding.gestureId));

  const activateSet = (setId) => {
    setActiveSetId(setId);
    setSelectedSetId(setId);
    setOpenControl('');
    setBindings({});
  };

  const getSetStatus = (setId) => (setId === activeSetId ? '활성 세트' : '대기');

  const getControlKey = (deviceId, controlLabel) => `${deviceId}:${controlLabel}`;
  const getControlBinding = (control) => bindings[getControlKey(selectedDevice.id, control.label)];
  const clearSelectedDeviceBindings = () => {
    setBindings((current) => {
      const next = { ...current };
      selectedDevice.controls.forEach((control) => {
        delete next[getControlKey(selectedDevice.id, control.label)];
      });
      return next;
    });
    setOpenControl('');
  };
  const setControlBinding = (control, gesture) => {
    setBindings((current) => ({
      ...current,
      [getControlKey(selectedDevice.id, control.label)]: {
        gestureId: gesture.id,
        gestureName: gesture.name,
        action: gesture.action,
        setId: activeSet.id,
        setName: activeSet.name,
      },
    }));
    setOpenControl('');
  };

  return (
    <div className="page-stack">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          ['history', '제스처 히스토리'],
          ['list', '제스처 목록'],
          ['iot', 'IoT 상태'],
        ]}
      />

      <div className="home-summary-grid">
        <Metric label="오늘 인식" value="18회" detail="더미 데이터 기준" />
        <Metric label="활성 제스처" value={`${activeSet.gestureCount}개`} detail={activeSet.name} />
        <Metric label="연결 IoT" value={`${onlineCount}/${iotDevices.length}`} detail="온라인 기기" />
      </div>

      {tab === 'history' && (
        <Card title="인식 로그" action="최근 기록" wide>
          <div className="gesture-history-list">
            {gestureHistory.map((item) => (
              <article className="gesture-history-item" key={item.id}>
                <div className="gesture-history-icon">⌁</div>
                <div>
                  <strong>{item.gesture}</strong>
                  <span>
                    {item.device} · {item.action}
                  </span>
                </div>
                <div className="history-meta">
                  <time>{item.time}</time>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {tab === 'list' && (
        <div className="gesture-management">
          <div className="gesture-set-list">
            {gestureSets.map((set) => (
              <article
                className={`gesture-set-card ${selectedSetId === set.id ? 'selected' : ''} ${activeSetId === set.id ? 'active-set' : ''}`}
                key={set.id}
              >
                <button type="button" className="gesture-set-select-button" onClick={() => setSelectedSetId(set.id)}>
                  <span>{getSetStatus(set.id)}</span>
                  <strong>{set.name}</strong>
                  <p>{set.description}</p>
                  <small>{set.gestureCount}개 제스처</small>
                </button>
                <button
                  type="button"
                  className="gesture-set-activate"
                  disabled={activeSetId === set.id}
                  onClick={() => activateSet(set.id)}
                >
                  {activeSetId === set.id ? '활성화됨' : '활성화'}
                </button>
              </article>
            ))}
          </div>

          <Card title={selectedSet.name} action="선택된 세트" wide>
            <p className="section-description">{selectedSet.description}</p>
            <div className="gesture-card-grid">
              {selectedSet.gestures.map((gesture) => (
                <article className="gesture-control-card" key={gesture.id}>
                  <div className="gesture-placeholder">
                    <span>사진 없음</span>
                  </div>
                  <div>
                    <span className={`status-chip ${gesture.status}`}>{gesture.status === 'active' ? '활성' : '비활성'}</span>
                    <h3>{gesture.name}</h3>
                    <p>{gesture.action}</p>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'iot' && (
        <div className="iot-layout">
          <Card title="IoT 기기">
            <div className="iot-device-list">
              {iotDevices.map((device) => (
                <button
                  className={`iot-device-row ${selectedDevice.id === device.id ? 'selected' : ''}`}
                  key={device.id}
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  <span className={`device-dot ${device.connection}`} />
                  <div>
                    <strong>{device.name}</strong>
                    <small>{device.room}</small>
                  </div>
                  <em>{device.connection === 'online' ? '온라인' : '대기'}</em>
                </button>
              ))}
            </div>
          </Card>

          <Card title={`${selectedDevice.name} 제어 상태`} action={selectedDevice.room} wide>
            <div className="selected-device-panel">
              <div>
                <span className={`device-dot ${selectedDevice.connection}`} />
                <strong>{selectedDevice.state}</strong>
                <p>활성 세트: {activeSet.name} · {displayedBinding}</p>
              </div>
              <button type="button" onClick={clearSelectedDeviceBindings}>전체 비활성화</button>
            </div>

            <div className="control-binding-list">
              {selectedDevice.controls.map((control) => {
                const binding = getControlBinding(control);

                return (
                  <article className="control-binding-item" key={control.label}>
                    <div className="control-binding-row">
                      <div>
                        <strong>{control.label}</strong>
                        <span>현재 연결: {binding?.gestureName || '미지정'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenControl((current) => (current === control.label ? '' : control.label))
                        }
                      >
                        설정
                      </button>
                    </div>
                    {openControl === control.label && (
                      <div className="gesture-picker">
                        {activeGestures.map((gesture) => {
                          const currentGesture = binding?.gestureId === gesture.id;
                          const usedElsewhere = usedGestureIds.has(gesture.id) && !currentGesture;

                          return (
                            <button
                              type="button"
                              className={currentGesture ? 'selected' : ''}
                              disabled={usedElsewhere}
                              key={`${control.label}-${gesture.setName}-${gesture.id}`}
                              onClick={() => setControlBinding(control, gesture)}
                            >
                              <span>{gesture.name}</span>
                              <small>
                                {usedElsewhere ? '다른 제어에 사용 중' : `${gesture.setName} · ${gesture.action}`}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

const settingCategories = [
  { id: 'devices', label: '기기등록', desc: '레이더 연결 상태와 감지 구역을 관리합니다.' },
  { id: 'sleep', label: '수면 설정', desc: '오늘 밤 수면 계획과 자동 제어를 관리합니다.' },
  { id: 'account', label: '계정', desc: '가구 구성원의 프로필을 확인합니다.' },
  { id: 'personal', label: '개인 설정', desc: '내 이름을 변경합니다.' },
  { id: 'general', label: '일반', desc: '테마와 언어를 설정합니다.' },
];

function SettingPage({ accounts, accountId, account, onSwitchAccount, onRenameAccount, onAddAccount, category, setCategory }) {
  return (
    <div className="settings-page">
      <section className="settings-hero card">
        <div className="settings-hero-profile">
          <span className="settings-hero-avatar">{account.name.charAt(0)}</span>
          <div>
            <p className="eyebrow">설정</p>
            <h2 className="settings-hero-name">{account.name}</h2>
          </div>
        </div>
      </section>

      <div className="settings-layout">
        <nav className="settings-nav">
          {settingCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </nav>

        <div className="settings-detail">
          {category === 'devices' && <DeviceRegistrationSettings accounts={accounts} />}
          {category === 'sleep' && <SleepSettings />}
          {category === 'account' && (
            <AccountSettings
              accounts={accounts}
              accountId={accountId}
              onSwitchAccount={onSwitchAccount}
              onAddAccount={onAddAccount}
            />
          )}
          {category === 'personal' && (
            <PersonalSettings key={accountId} account={account} onRenameAccount={onRenameAccount} />
          )}
          {category === 'general' && <GeneralSettings />}
        </div>
      </div>
    </div>
  );
}

const initialRadarZones = [
  { id: 'room1', name: '방 1', owner: 'kim', active: true, connected: true },
  { id: 'room2', name: '방 2', owner: 'park', active: true, connected: true },
  { id: 'study', name: '서재', owner: 'kim', active: false, connected: false },
];

function DeviceRegistrationSettings({ accounts }) {
  const [zones, setZones] = useState(initialRadarZones);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneOwner, setNewZoneOwner] = useState(accounts[0]?.id || '');

  const ownerName = (ownerId) => accounts.find((item) => item.id === ownerId)?.name || '공용';
  const connectedCount = zones.filter((zone) => zone.connected).length;
  const allConnected = zones.length > 0 && connectedCount === zones.length;

  const toggleZone = (id) => {
    setZones((current) => current.map((zone) => (zone.id === id ? { ...zone, active: !zone.active } : zone)));
  };

  const removeZone = (id) => {
    setZones((current) => current.filter((zone) => zone.id !== id));
  };

  const addZone = () => {
    if (!newZoneName.trim()) return;
    setZones((current) => [
      ...current,
      { id: `zone-${Date.now()}`, name: newZoneName.trim(), owner: newZoneOwner, active: true, connected: true },
    ]);
    setNewZoneName('');
  };

  return (
    <Card title="레이더 관리" action={`${zones.filter((zone) => zone.active).length}개 활성`}>
      <div className={`radar-status-row ${allConnected ? '' : 'warn'}`}>
        <span className="pulse" />
        <div>
          <strong>{allConnected ? '레이더 연결됨' : '일부 레이더 연결 끊김'}</strong>
          <span>등록된 구역 {zones.length}개 · 연결 {connectedCount}개</span>
        </div>
      </div>

      <div className="zone-list">
        {zones.map((zone) => (
          <div className={`zone-row ${zone.active ? 'active' : ''}`} key={zone.id}>
            <span className={`device-dot ${zone.connected ? 'online' : 'idle'}`} />
            <div className="zone-info">
              <strong>{zone.name}</strong>
              <span>{ownerName(zone.owner)}의 구역 · {zone.connected ? '연결됨' : '연결 끊김'}</span>
            </div>
            <div className="zone-actions">
              <button
                type="button"
                className={`toggle-switch ${zone.active ? 'on' : ''}`}
                onClick={() => toggleZone(zone.id)}
                aria-label={`${zone.name} 레이더 토글`}
              >
                <i />
              </button>
              <button
                type="button"
                className="zone-delete"
                onClick={() => removeZone(zone.id)}
                aria-label={`${zone.name} 삭제`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="zone-add-row">
        <input
          type="text"
          placeholder="구역 이름 (예: 거실)"
          value={newZoneName}
          onChange={(event) => setNewZoneName(event.target.value)}
        />
        <select value={newZoneOwner} onChange={(event) => setNewZoneOwner(event.target.value)}>
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={addZone}>구역 추가</button>
      </div>
    </Card>
  );
}

function AccountSettings({ accounts, accountId, onSwitchAccount, onAddAccount }) {
  const [newMemberName, setNewMemberName] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) return;
    onAddAccount(newMemberName.trim());
    setNewMemberName('');
  };

  return (
    <Card title="가구 구성원" action={`${accounts.length}명`}>
      <div className="household-list">
        {accounts.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`household-row ${item.id === accountId ? 'active' : ''}`}
            onClick={() => onSwitchAccount(item.id)}
          >
            <span className="mini-avatar">{item.name.charAt(0)}</span>
            <strong>{item.name}</strong>
            {item.id === accountId && <em>현재 사용 중</em>}
          </button>
        ))}
      </div>

      <div className="zone-add-row">
        <input
          type="text"
          placeholder="구성원 이름"
          value={newMemberName}
          onChange={(event) => setNewMemberName(event.target.value)}
        />
        <button type="button" onClick={addMember}>멤버 추가</button>
      </div>
    </Card>
  );
}

function PersonalSettings({ account, onRenameAccount }) {
  const [name, setName] = useState(account.name);
  const dirty = name.trim().length > 0 && name.trim() !== account.name;

  const save = () => {
    if (!dirty) return;
    onRenameAccount(account.id, name.trim());
  };

  return (
    <Card title="개인 설정">
      <div className="personal-profile-panel">
        <div className="personal-profile-avatar">{account.name.charAt(0)}</div>
        <input
          type="text"
          className="personal-profile-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" className="personal-profile-save" disabled={!dirty} onClick={save}>
          저장
        </button>
      </div>
    </Card>
  );
}

const alarmSongs = [
  { id: 'sign-of-the-times', label: 'Sign of the Times – Harry Styles' },
  { id: 'love-yourself', label: 'Love Yourself - Justin Bieber' },
];

function GeneralSettings() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ko');
  const [notificationSound, setNotificationSound] = useState(alarmSongs[0].id);

  return (
    <Card title="일반">
      <div className="general-setting-row">
        <div>
          <strong>테마</strong>
          <span>화면 밝기와 톤을 선택합니다.</span>
        </div>
        <div className="segmented">
          <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>라이트</button>
          <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>다크</button>
        </div>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>언어</strong>
          <span>앱에서 사용할 언어를 선택합니다.</span>
        </div>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>알림음 설정</strong>
          <span>알림이 울릴 때 재생할 곡을 선택합니다.</span>
        </div>
        <select value={notificationSound} onChange={(event) => setNotificationSound(event.target.value)}>
          {alarmSongs.map((song) => (
            <option key={song.id} value={song.id}>{song.label}</option>
          ))}
        </select>
      </div>
    </Card>
  );
}

function Stepper({ value, min, max, step = 1, unit = '', onChange }) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={decrease} disabled={value <= min} aria-label="값 감소">
        −
      </button>
      <span className="stepper-value">{value}{unit}</span>
      <button type="button" className="stepper-btn" onClick={increase} disabled={value >= max} aria-label="값 증가">
        +
      </button>
    </div>
  );
}

function getSleepDuration(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

function SleepSettings() {
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [acAuto, setAcAuto] = useState(true);
  const [acTemp, setAcTemp] = useState(25);
  const [lightAuto, setLightAuto] = useState(true);
  const [dimStart, setDimStart] = useState(30);
  const [finalBright, setFinalBright] = useState(10);
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(true);
  const [s3, setS3] = useState(true);
  const [wakeUpSound, setWakeUpSound] = useState(alarmSongs[1].id);

  return (
    <div className="page-stack">
      <Card title="오늘 밤 수면 계획">
        <div className="sleep-settings-time-grid">
          <div className="sleep-settings-time-field">
            <p>취침 시간</p>
            <input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} />
          </div>
          <div className="sleep-settings-time-field">
            <p>기상 시간</p>
            <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
          </div>
        </div>
        <div className="sleep-settings-duration">
          예상 수면 시간: <strong>{getSleepDuration(bedtime, wakeTime)}</strong>
        </div>
        <div className="general-setting-row">
          <div>
            <strong>기상음 설정</strong>
            <span>아침 알람에서 재생할 곡을 선택합니다.</span>
          </div>
          <select value={wakeUpSound} onChange={(event) => setWakeUpSound(event.target.value)}>
            {alarmSongs.map((song) => (
              <option key={song.id} value={song.id}>{song.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="에어컨 자동 온도 조절">
        <div className="general-setting-row">
          <div>
            <strong>자동 온도 조절</strong>
            <span>수면 단계에 따라 최적 온도 유지</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${acAuto ? 'on' : ''}`}
            onClick={() => setAcAuto((value) => !value)}
            aria-label="자동 온도 조절 토글"
          >
            <i />
          </button>
        </div>
        <div className="general-setting-row">
          <strong>목표 온도</strong>
          <Stepper value={acTemp} min={20} max={28} unit="°C" onChange={setAcTemp} />
        </div>
        <div className="stat-trio">
          <div className="stat-trio-item">
            <p>입면 전</p>
            <strong>{acTemp + 1}°C</strong>
          </div>
          <div className="stat-trio-item">
            <p>수면 중</p>
            <strong>{acTemp}°C</strong>
          </div>
          <div className="stat-trio-item">
            <p>기상 전</p>
            <strong>{acTemp + 2}°C</strong>
          </div>
        </div>
      </Card>

      <Card title="입면 조명 자동 조절">
        <div className="general-setting-row">
          <div>
            <strong>조명 자동 조절</strong>
            <span>취침 전 조명을 점진적으로 어둡게</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${lightAuto ? 'on' : ''}`}
            onClick={() => setLightAuto((value) => !value)}
            aria-label="조명 자동 조절 토글"
          >
            <i />
          </button>
        </div>
        {lightAuto && (
          <>
            <div className="general-setting-row">
              <strong>조절 시작 (취침 N분 전)</strong>
              <Stepper value={dimStart} min={10} max={60} step={5} unit="분 전" onChange={setDimStart} />
            </div>
            <div className="general-setting-row">
              <strong>최종 밝기</strong>
              <Stepper value={finalBright} min={0} max={30} step={5} unit="%" onChange={setFinalBright} />
            </div>
            <div className="light-timeline">
              <p>조명 타임라인</p>
              <div className="light-timeline-bars">
                {[100, 80, 60, 40, 20, finalBright].map((b, index) => (
                  <div key={index} className="light-timeline-bar" style={{ height: `${b}%`, opacity: 0.3 + b / 200 }} />
                ))}
              </div>
              <div className="light-timeline-labels">
                <span>현재</span>
                <span>취침 -{dimStart}분</span>
                <span>취침</span>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card title="단계별 기상 알람">
        <div className="wake-alarm-list">
          <WakeAlarmRow
            title="1단계 · 조명 서서히 밝히기"
            time="기상 30분 전"
            on={s1}
            onToggle={() => setS1((value) => !value)}
          />
          <WakeAlarmRow
            title="2단계 · 수면 음악 / 라디오 재생"
            time="기상 15분 전"
            on={s2}
            onToggle={() => setS2((value) => !value)}
          />
          <WakeAlarmRow
            title="3단계 · TV 켜기 / 알람 울리기"
            time="기상 시간"
            on={s3}
            onToggle={() => setS3((value) => !value)}
          />
        </div>
      </Card>

      {/* <Card title="수면 부채 관리" action={`이번 주 누적 부채 ${debtHours}시간 ${debtMinutes}분`}>
        <div className="general-setting-row">
          <div>
            <strong>수면 부채 경고</strong>
            <span>부채가 쌓이면 익일 컨디션 저하를 미리 알림</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${debtAlertOn ? 'on' : ''}`}
            onClick={() => setDebtAlertOn((value) => !value)}
            aria-label="수면 부채 경고 토글"
          >
            <i />
          </button>
        </div>
        {debtAlertOn && (
          <>
            <div className="sleep-settings-slider-block">
              <div className="sleep-settings-slider-label">
                <span>목표(7.5h) 대비 누적 부채</span>
                <strong>{debtHours}시간 {debtMinutes}분</strong>
              </div>
              <div className="debt-bar">
                <i
                  style={{
                    width: `${Math.min(100, (weeklyDebt / 10) * 100)}%`,
                    background: weeklyDebt > 6 ? '#f5b84b' : 'var(--wave)',
                  }}
                />
              </div>
            </div>
            <div className="debt-week-grid">
              {sleepTrend.map((d) => {
                const deficit = Math.max(0, sleepDebtGoal - d.value);
                return (
                  <div className={`debt-day ${deficit > 0 ? 'deficit' : ''}`} key={d.day}>
                    <span>{d.day}</span>
                    <strong>{deficit > 0 ? `-${deficit.toFixed(1)}h` : '✓'}</strong>
                  </div>
                );
              })}
            </div>
            <div className="sleep-settings-callout">
              <span>⚠</span>
              <p>누적 부채가 {debtHours}시간을 넘었어요 — 오늘은 30분 더 일찍 잠들어보세요.</p>
            </div>
          </>
        )}
      </Card>

      <Card title="야간 도파민 패턴 차단">
        <div className="general-setting-row">
          <div>
            <strong>야간 스마트폰 감지</strong>
            <span>감지 시 클래식 수면 음악 자동 재생</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${dopamine ? 'on' : ''}`}
            onClick={() => setDopamine((value) => !value)}
            aria-label="야간 스마트폰 감지 토글"
          >
            <i />
          </button>
        </div>
        {dopamine && (
          <>
            <div className="sleep-settings-music-row">
              <div className="sleep-settings-music-text">
                <strong>Clair de Lune — Debussy</strong>
                <span>클래식 수면 음악</span>
              </div>
              <button
                type="button"
                className={`sleep-settings-music-play ${musicOn ? '' : 'off'}`}
                onClick={() => setMusicOn((value) => !value)}
                aria-label="클래식 수면 음악 재생/정지"
              >
                {musicOn ? '⏸' : '▶'}
              </button>
            </div>
            <div className="sleep-settings-note">
              <p>마지막 감지</p>
              <strong>오늘 22:47 · 스마트폰 감지 → 음악 재생됨</strong>
            </div>
          </>
        )}
      </Card> */}
    </div>
  );
}

function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map(([id, label]) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, action, children, wide, onClick }) {
  return (
    <section
      className={`card ${wide ? 'wide' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') onClick();
            }
          : undefined
      }
    >
      <div className="card-head">
        <h3>{title}</h3>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, detail, dot }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>
        {dot && <span className={`metric-dot ${dot}`} />}
        {value}
      </strong>
      <span>{detail}</span>
    </div>
  );
}

function InfoList({ items }) {
  return (
    <div className="info-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function SemiGauge({ value, max, label, tone = 'default' }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const deg = pct * 180;
  const fillColor = tone === 'warn' ? '#f5b84b' : '#95d9f8';

  return (
    <div className="semi-gauge">
      <div
        className="semi-gauge-fill"
        style={{
          background: `conic-gradient(from 270deg, ${fillColor} 0deg, ${fillColor} ${deg}deg, #eaf6fc ${deg}deg, #eaf6fc 180deg, transparent 180deg)`,
        }}
      />
      <div className="semi-gauge-hole" />
      <div className="semi-gauge-label">
        <strong>{label}</strong>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div key={item.label}>
          {item.turtleNeck !== undefined && <b className="bar-chart-note">거북목 {item.turtleNeck}회</b>}
          <i style={{ height: `${item.value}%` }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default App;
