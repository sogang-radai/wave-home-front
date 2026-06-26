import { useMemo, useState } from 'react';
import './App.css';
import logo from './img/logo.png';

const pages = [
  { id: 'main', label: '대시보드', icon: 'dashboard' },
  { id: 'sleep', label: '수면 관리', icon: 'moon' },
  { id: 'posture', label: '자세 관리', icon: 'posture' },
  { id: 'home', label: '가전 제어', icon: 'power' },
];

const notifications = [
  { title: '자세 알림', time: '방금 전', text: '목이 앞으로 나온 자세가 8분 이상 지속되었습니다.' },
  { title: '수면 리포트', time: '오늘 08:00', text: '어제 수면 점수는 84점입니다. 깊은 수면 비율이 개선되었습니다.' },
  { title: '레이더 상태', time: '어제 23:12', text: '서재 레이더 연결 상태가 안정적으로 유지되고 있습니다.' },
];

const initialAccounts = [
  { id: 'kim', name: '김건강' },
  { id: 'park', name: '박웰빙' },
];

const pageTitles = {
  main: '대시보드',
  sleep: '수면 관리',
  posture: '자세 관리',
  home: '가전 제어',
  setting: '설정',
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
  { label: '09', value: 78 },
  { label: '10', value: 84 },
  { label: '11', value: 68 },
  { label: '12', value: 73 },
  { label: '14', value: 88 },
  { label: '15', value: 71 },
  { label: '16', value: 76 },
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

const snoringLog = [
  { time: '01:12', duration: '4분' },
  { time: '03:48', duration: '6분' },
  { time: '05:20', duration: '3분' },
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

const todos = [
  { title: '오후 10시 이후 화면 밝기 줄이기', done: true },
  { title: '50분 착석 후 1분 스트레칭', done: true },
  { title: '취침 전 방 온도 24도로 조정', done: false },
  { title: '목 스트레칭 루틴 2회', done: false },
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
  const [sleepTab, setSleepTab] = useState('daily');
  const [postureTab, setPostureTab] = useState('current');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInsightChat, setShowInsightChat] = useState(false);
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
    <div className="app-shell">
      <InsightChat open={showInsightChat} onClose={() => setShowInsightChat(false)} />
      <Sidebar page={page} onSelect={setPage} today={today} />
      <section className="workspace">
        <TopBar
          title={pageTitles[page]}
          showNotifications={showNotifications}
          onToggleNotifications={() => setShowNotifications((value) => !value)}
          accounts={accounts}
          account={account}
          onSwitchAccount={setAccountId}
          showInsightChat={showInsightChat}
          onToggleInsightChat={() => setShowInsightChat((value) => !value)}
        />
        <main className="content">
          {page === 'main' && <MainPage onNavigate={setPage} />}
          {page === 'sleep' && <SleepPage tab={sleepTab} setTab={setSleepTab} />}
          {page === 'posture' && <PosturePage tab={postureTab} setTab={setPostureTab} />}
          {page === 'home' && <HomeControlPage />}
          {page === 'setting' && (
            <SettingPage
              accounts={accounts}
              accountId={accountId}
              account={account}
              onSwitchAccount={setAccountId}
              onRenameAccount={renameAccount}
              onAddAccount={addAccount}
            />
          )}
        </main>
      </section>
    </div>
  );
}

function Sidebar({ page, onSelect, today }) {
  const [collapsed, setCollapsed] = useState(false);

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
        <button className="collapse-button" aria-label="collapse sidebar" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? '›' : '‹'}
        </button>
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
        <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a7 7 0 1 0 11.5 11.5Z" />
      </svg>
    );
  }

  if (name === 'posture') {
    return (
      <svg {...common}>
        <path d="M12 3v18" />
        <path d="M8.5 6.5c2 1.2 5 1.2 7 0" />
        <path d="M8 11c2.4 1.4 5.6 1.4 8 0" />
        <path d="M8.5 15.5c2 1.2 5 1.2 7 0" />
        <path d="M6.5 20.5h11" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <path d="M10 7h4" />
      <circle cx="12" cy="12" r="2" />
      <path d="M9.5 17h5" />
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

function TopBar({
  title,
  showNotifications,
  onToggleNotifications,
  accounts,
  account,
  onSwitchAccount,
  showInsightChat,
  onToggleInsightChat,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button
          className={`insight-trigger ${showInsightChat ? 'active' : ''}`}
          aria-label="AI 인사이트 채팅"
          onClick={onToggleInsightChat}
        >
          
            <span className="insight-chat-spark" style={{ color: "#000" }}>✦</span>
          WaveAI
        </button>
        <button className="bell" aria-label="알림" onClick={onToggleNotifications}>
          <BellIcon />
          <b>2</b>
        </button>
        {showNotifications && <NotificationsPanel />}
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
    </header>
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

function NotificationsPanel() {
  return (
    <div className="notifications-panel">
      <div className="notifications-head">
        <strong>알림 내역</strong>
        <span>{notifications.length}개</span>
      </div>
      {notifications.map((item) => (
        <div className="notification-item" key={`${item.title}-${item.time}`}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.time}</span>
          </div>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

const insightSuggestions = [
  '오늘 수면 인사이트 알려줘',
  '자세 점수가 왜 낮아졌어?',
  '오늘 심박수 어때?',
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

const dailyMessage = {
  headline: '오늘도 잘 해내고 있어요',
  body: '어제 수면 점수는 84점으로, 입면까지 24분이 걸렸고 깊은 수면 비율은 전주 평균보다 8% 높았어요. 자세 점수는 78점으로, 오후 3시 이후 목이 앞으로 나오는 패턴이 반복되었으니 짧은 스트레칭으로 챙겨주세요. 오늘은 취침 1시간 전 조명을 낮추고, 50분 착석마다 1분 목 리셋 루틴을 실행해보세요!',
};

function MainPage({ onNavigate }) {
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

        <Card title="오늘 할일" action="4개">
          <div className="todo-list">
            {todos.map((todo) => (
              <div className="todo" key={todo.title}>
                <span className={todo.done ? 'checked' : ''}>{todo.done ? '✓' : ''}</span>
                <p>{todo.title}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="dashboard-grid">
        <Card title="어젯밤 수면" onClick={() => onNavigate('sleep')}>
          <div className="stat-trio">
            <div className="stat-trio-item">
              <strong>7.0<span>h</span></strong>
              <small>달성</small>
            </div>
            <div className="stat-trio-item">
              <strong>7.2<span>h</span></strong>
              <small>7일 평균</small>
            </div>
            <div className="stat-trio-item">
              <p>목표</p>
              <strong>7.5<span>h</span></strong>
              <small>일일 목표</small>
            </div>
          </div>
          <InfoList
            items={[
              ['입면 시간', '23:42'],
              ['기상 시간', '06:42'],
            ]}
          />
        </Card>

        <Card title="자세 점수" onClick={() => onNavigate('posture')}>
          <div className="posture-score-panel">
            <SemiGauge value={68} max={100} label="주의" tone="warn" />
            <p className="posture-score-readout">
              자세 점수 <strong>68점</strong> / 100
            </p>
            <div className="posture-score-note">
              <strong>거북목 감지 오늘 4회</strong>
              <span>전주 평균 7.3회 대비 개선</span>
            </div>
          </div>
          <div className="split-stats">
            <Metric label="바른 자세" value="71%" />
            <Metric label="알림 수락" value="62%" />
          </div>
        </Card>

        <Card title="심박수">
          <div className="big-number">
            62<span>bpm</span>
            <small>현재 심박수</small>
          </div>
          <p className="section-description">오늘 시간대별</p>
          <LineChart data={heartRateTrend} min={45} max={95} />
          <div className="stat-trio">
            <div className="stat-trio-item">
              <strong>54</strong>
              <small>최저</small>
            </div>
            <div className="stat-trio-item">
              <strong>69</strong>
              <small>평균</small>
            </div>
            <div className="stat-trio-item">
              <strong>82</strong>
              <small>최고</small>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function SleepPage({ tab, setTab }) {
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
          <Card title="수면 추세" action="최근 7일" wide>
            <div className="big-number">
              7.0<span>h</span>
              <small>목표 7.5h 대비 93%</small>
            </div>
            <LineChart data={sleepTrend} min={4} max={9} />
          </Card>
          <Card title="이번 주 누적 수면 시간">
            <Ring value={47.7} max={52.5} label="47.7h" />
            <div className="split-stats">
              <Metric label="평균" value="6.8h" detail="7일 평균" />
              <Metric label="규칙성" value="82%" detail="기상 시간 안정" />
            </div>
          </Card>
          <Card title="오늘 밤 수면 계획" action="Plan">
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
        </div>
      )}
      {tab === 'daily' && (
        <SleepDailyReport />
      )}
      {tab === 'weekly' && (
        <SleepWeeklyReport />
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

function SleepStageGraph({ data }) {
  return (
    <div className="sleep-stage-graph">
      <div className="sleep-stage-bars">
        {data.map((item) => (
          <div className="sleep-stage-column" key={item.time} tabIndex={0}>
            <div className="sleep-stage-track">
              <i style={{ height: `${item.level}%` }} />
            </div>
            <span>{item.time}</span>
            <div className="chart-tooltip">
              <strong>{item.time} · {item.stage}</strong>
              <span>호흡 {item.breath}회/분</span>
              <span>심박 {item.heart}bpm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function formatReportDateLabel(date, latestDate) {
  if (isSameDay(date, latestDate)) return '어제';
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
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

function DateNavigator({ date, latestDate, onChange }) {
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
        {formatReportDateLabel(date, latestDate)}
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

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function summarizeValues(values) {
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
  };
}

function SleepDailyReport() {
  const [reportDate, setReportDate] = useState(getYesterday);
  const [latestDate] = useState(getYesterday);

  const heartStats = summarizeValues(sleepStageLog.map((d) => d.heart));
  const breathStats = summarizeValues(sleepStageLog.map((d) => d.breath));
  const snoringMinutes = snoringLog.reduce((sum, item) => sum + parseInt(item.duration, 10), 0);

  return (
    <CareReport
      type="daily"
      title={`${formatReportDateLabel(reportDate, latestDate)} 수면 리포트`}
      score="82점"
      summary="새벽 3시쯤 방 온도가 오르면서 뒤척임이 늘었어요. 그 영향으로 얕은 수면으로 자주 넘어간 밤이었어요."
      visual={<SleepStageGraph data={sleepStageLog} />}
      visualAction="AI 코멘트"
      dateNav={<DateNavigator date={reportDate} latestDate={latestDate} onChange={setReportDate} />}
      extra={
        <div className="dashboard-grid">
          <Card title="심박수" action={`평균 ${heartStats.avg}bpm`}>
            <LineChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.heart }))} min={45} max={85} />
            <div className="stat-trio">
              <div className="stat-trio-item"><p>최저</p><strong>{heartStats.min}</strong></div>
              <div className="stat-trio-item"><p>평균</p><strong>{heartStats.avg}</strong></div>
              <div className="stat-trio-item"><p>최고</p><strong>{heartStats.max}</strong></div>
            </div>
          </Card>
          <Card title="호흡" action={`평균 ${breathStats.avg}회/분`}>
            <LineChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.breath }))} min={8} max={22} />
            <div className="stat-trio">
              <div className="stat-trio-item"><p>최저</p><strong>{breathStats.min}</strong></div>
              <div className="stat-trio-item"><p>평균</p><strong>{breathStats.avg}</strong></div>
              <div className="stat-trio-item"><p>최고</p><strong>{breathStats.max}</strong></div>
            </div>
          </Card>
          <Card title="코골이" action={`${snoringLog.length}회 감지`}>
            <div className="big-number">
              {snoringMinutes}<span>분</span>
              <small>오늘 밤 총 코골이 시간</small>
            </div>
            <InfoList items={snoringLog.map((item) => [item.time, item.duration])} />
          </Card>
        </div>
      }
      analysis={[
        ['수면 점수', '82점', '전일 대비 +4점'],
        ['총 수면 시간', '6h 52m', '목표 7h 30m 대비 -38분'],
        ['입면 시간', '27분', '스마트폰 사용 후 지연'],
        ['뒤척임 집중 시간', '03:05~03:40', '온도 26℃ 이상 구간'],
        ['수면 부채', '2h 10m', '이번 주 안에 회복 권장'],
      ]}
      insights={[
        ['오늘의 권장 액션', '에어컨 예약을 새벽 4시까지 1시간 연장', '최근 3일 동안 방 온도가 26℃를 넘으면 뒤척임이 눈에 띄게 늘었어요. 에어컨 예약을 새벽 4시까지 1시간 늘려볼게요.'],
        ['취침 전 루틴', '23:00 스마트폰 차단 · 23:20 조도 낮춤 · 23:30 취침', '화면을 오래 보면 수면 부채가 쌓이기 쉬워요. 23:00엔 스마트폰을 멀리하고 23:20엔 조명을 낮춘 뒤 23:30에 잠들어보세요.'],
        ['주의사항', '새벽 3시 전후 얕은 수면 전환 가능성', '이 시간대에 온도와 소음이 함께 흔들리면 다시 잠들기 어려워질 수 있어요. 조금만 더 신경 써볼까요?'],
        ['자동화 제안', '기상 30분 전 조명 20% → 60%로 서서히 상승', '심박이 안정적으로 올라오는 구간에 맞춰 빛을 천천히 늘리면 더 가볍게 깰 수 있어요.'],
      ]}
    />
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
  weeklyScores = [],
  averageScore,
  dateNav,
  extra,
}) {
  const isWeekly = type === 'weekly';

  return (
    <div className="care-report-layout">
      {dateNav}
      {visual && (
        <Card title={title} action={visualAction} wide>
          <p className="report-summary-only">{summary}</p>
          {visual}
        </Card>
      )}
      {extra}
      {isWeekly && (
        <Card title={title} action={score} wide>
          <p className="report-summary-only">{summary}</p>
          <div className="weekly-score-chart">
            <div className="weekly-score-bars">
              {weeklyScores.map(([day, value]) => (
                <div className="weekly-score-bar" key={day} tabIndex={0}>
                  <div className="weekly-score-track">
                    <i style={{ height: `${value}%` }}>
                      <span className="weekly-score-value">{value}</span>
                    </i>
                  </div>
                  <span>{day}</span>
                  <div className="chart-tooltip">
                    <strong>{day}요일 · {value}점</strong>
                    <span>{value >= 85 ? '좋음' : value >= 78 ? '보통 이상' : '관리 필요'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="weekly-score-average">
              <span>평균 점수</span>
              <strong>{averageScore || score}</strong>
              <p>7일 점수 기준</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="핵심 분석">
        <div className="care-analysis-grid">
          {analysis.map(([label, value, detail]) => (
            <Metric key={label} label={label} value={value} detail={detail} />
          ))}
        </div>
      </Card>

      <Card title="인사이트">
        <div className="insight-list">
          {insights.map(([label, titleText, text]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{titleText}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SleepWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score="81점"
      summary="평균 수면 시간은 줄었지만, 기상 규칙성과 깊은 수면 비율은 후반으로 갈수록 개선되었습니다."
      weeklyScores={[
        ['월', 74],
        ['화', 76],
        ['수', 79],
        ['목', 80],
        ['금', 82],
        ['토', 87],
        ['일', 89],
      ]}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→89점', '주 후반 회복세'],
        ['총합 수면 시간', '46.8h', '전주 대비 18% 감소'],
        ['수면 부채', '2h 10m', '평일 누적 부족'],
        ['온도 민감 구간', '3회', '26℃ 이상에서 뒤척임 증가'],
        ['기상 규칙성', '82%', '전주 대비 +6%'],
      ]}
      insights={[
        ['다음 주 목표', '평일 23:30 이전 취침 4회 달성', '주말 회복 수면에 의존하지 않도록 평일 수면 총량을 먼저 올려야 합니다.'],
        ['수면 부채 회복 플랜', '월~목 20분씩 추가 수면, 금요일은 7시간 30분 확보', '한 번에 몰아서 자는 것보다 평일에 조금씩 갚는 쪽이 리듬 유지에 유리합니다.'],
        ['환경 자동화', '새벽 1시~4시 냉방 유지, 기상 30분 전 조명 알람', '온도와 기상 리듬을 같이 고정하면 뒤척임과 수면 관성을 줄일 가능성이 큽니다.'],
        ['주의사항', '주말 늦잠은 1시간 이내로 제한', '토요일 보상 수면이 길어지면 일요일 밤 입면 시간이 다시 밀릴 수 있습니다.'],
      ]}
    />
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
            <div className="posture-face">
              <div>• •</div>
              <span>주의</span>
            </div>
            <InfoList
              items={[
                ['현재 감지된 자세', '목이 앞으로 12도 나옴'],
                ['현재 자세 피드백', '턱을 살짝 당기고 어깨를 뒤로 열어주세요'],
              ]}
            />
          </Card>
          <Card title="오늘의 자세 점수" action="현재">
            <Ring value={78} max={100} label="78점" />
            <div className="split-stats">
              <Metric label="바른자세" value="71%" detail="목표 80%" />
              <Metric label="알림 수락" value="62%" detail="전주 대비 개선" />
            </div>
          </Card>
          <Card title="오늘 누적 착석 시간" action="현재">
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
          <Card title="시간대별 바른 자세 퍼센트" wide>
            <BarChart data={postureBars} />
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

function PostureDailyReport() {
  return (
    <CareReport
      type="daily"
      title="어제의 자세 리포트"
      score="82점"
      summary="오래 앉아 있을수록 허리보다 목 자세가 먼저 무너지는 패턴이 반복되었습니다."
      visual={<PostureLogGraph data={postureLog} />}
      analysis={[
        ['자세 점수', '82점', '어제보다 6점 상승'],
        ['책상 앞 체류 시간', '5h 20m', '오후 업무 구간 집중'],
        ['바른 자세 유지', '62%', '목표 70%까지 8%p 부족'],
        ['거북목 위험 시간', '48분', '3단계 알림 전 1회 회복'],
        ['허리 굽음 시간', '1h 10m', '골반 세우기 피드백 필요'],
        ['가장 무너진 시간대', '15:00~17:00', '목 전방 자세 반복'],
      ]}
      insights={[
        ['오늘의 권장 액션', '50분마다 목 스트레칭, 오후 3시 전 모니터 높이 재확인', '목이 먼저 무너지는 날은 허리를 펴기보다 시선 높이를 먼저 맞추는 편이 좋습니다.'],
        ['추천 루틴', '턱 당기기 20초 · 어깨 열기 20초 · 1분 기지개', '장시간 움직임이 없을 때는 자세 교정보다 짧은 휴식 제안이 우선입니다.'],
        ['알림 조정', '거북목은 8분 지속 시 음성 안내, 허리는 반복 3회부터 안내', '가벼운 흔들림은 대시보드 알림으로 두고 반복 패턴만 음성으로 올리는 구성이 적절합니다.'],
        ['주의사항', '오후 3시~5시에는 허리보다 목 자세를 먼저 체크', '해당 시간대에는 집중도가 높아질수록 고개가 앞으로 나오는 패턴이 반복되었습니다.'],
      ]}
    />
  );
}

function PostureWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 자세 리포트"
      score="81점"
      summary="자세 점수는 상승했지만 허리 굽음 빈도는 늘어, 목 리셋과 허리 리셋을 분리해서 관리해야 합니다."
      weeklyScores={[
        ['월', 74],
        ['화', 76],
        ['수', 78],
        ['목', 80],
        ['금', 81],
        ['토', 86],
        ['일', 92],
      ]}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→81점', '주간 평균 기준 개선'],
        ['거북목 지속 시간', '18% 감소', '목 리셋 알림 반응 개선'],
        ['허리 굽음 빈도', '9% 증가', '오후 착석 후반부 집중'],
        ['휴식 루틴 수행률', '64%', '목표 80%까지 16%p 부족'],
        ['장시간 착석 알림', '7회', '50분 이상 같은 자세 유지'],
      ]}
      insights={[
        ['다음 주 목표', '50분 착석 후 1분 휴식 4회, 오후 3시 이후 거북목 20% 감소', '가장 무너지는 시간대가 고정되어 있어 선제 알림을 앞당기는 편이 좋습니다.'],
        ['추천 루틴', '허리 리셋 하루 2회 · 목 리셋 하루 2회 · 1분 걷기', '허리 굽음은 증가했으므로 목 교정 루틴과 별도로 골반 세우기 루틴을 추가하세요.'],
        ['알림 전략', '1단계는 화면 표시, 2단계부터 음성 안내, 3단계는 휴식 제안', '계속 교정만 요구하면 피로도가 커지므로 장시간 무움직임에는 휴식 제안이 더 적합합니다.'],
        ['주의사항', '허리 굽음 빈도 9% 증가', '목 지표는 좋아졌지만 골반이 무너지며 허리가 말리는 보상 패턴이 생겼습니다.'],
        ['다음 주 체크포인트', '휴식 루틴 수행률 64% → 80%', '루틴 수행률이 올라가면 장시간 착석 알림과 거북목 지속 시간이 함께 줄 가능성이 높습니다.'],
      ]}
    />
  );
}

function PostureLogGraph({ data }) {
  return (
    <div className="posture-log-graph">
      <div className="posture-log-bars">
        {data.map((item) => (
          <div className="posture-log-column" key={item.time} tabIndex={0}>
            <div className="posture-log-track">
              <i style={{ height: `${item.score}%` }} />
            </div>
            <span>{item.time}</span>
            <div className="chart-tooltip">
              <strong>{item.time} · {item.label}</strong>
              <span>자세 점수 {item.score}</span>
              <span>{item.score < 60 ? '휴식 또는 교정 권장' : '관찰 유지'}</span>
            </div>
          </div>
        ))}
      </div>
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

function SettingPage({ accounts, accountId, account, onSwitchAccount, onRenameAccount, onAddAccount }) {
  const [category, setCategory] = useState('devices');

  return (
    <div className="settings-page">
      <section className="settings-hero card">
        <div>
          <p className="eyebrow">설정</p>
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
    <Card title="개인 설정" action="이름 수정">
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

function Ring({ value, max, label }) {
  const deg = Math.min(360, (value / max) * 360);
  return (
    <div className="ring-wrap">
      <div className="ring" style={{ background: `conic-gradient(#95d9f8 ${deg}deg, #eaf6fc 0deg)` }}>
        <div>{label}</div>
      </div>
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

function LineChart({ data, min, max }) {
  const width = 700;
  const height = 190;
  const points = data
    .map((item, index) => {
      const x = 20 + (index / (data.length - 1)) * (width - 40);
      const y = height - 24 - ((item.value - min) / (max - min)) * (height - 48);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="#95d9f8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(' ').map((point) => {
          const [cx, cy] = point.split(',');
          return <circle key={point} cx={cx} cy={cy} r="5" fill="#c8ebfb" stroke="#95d9f8" strokeWidth="2" />;
        })}
      </svg>
      <div className="chart-labels">
        {data.map((item) => (
          <span key={item.day}>{item.day}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div key={item.label}>
          <i style={{ height: `${item.value}%` }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default App;
