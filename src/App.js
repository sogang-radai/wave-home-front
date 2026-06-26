import { useMemo, useState } from 'react';
import './App.css';
import logo from './img/logo.png';
import logoWithString from './img/logo_with_string.png';

const pages = [
  { id: 'main', label: 'Main', icon: 'dashboard' },
  { id: 'sleep', label: '수면 관리', icon: 'moon' },
  { id: 'posture', label: '자세 관리', icon: 'posture' },
  { id: 'home', label: '가전 제어', icon: 'power' },
];

const notifications = [
  { title: '자세 알림', time: '방금 전', text: '목이 앞으로 나온 자세가 8분 이상 지속되었습니다.' },
  { title: '수면 리포트', time: '오늘 08:00', text: '어제 수면 점수는 84점입니다. 깊은 수면 비율이 개선되었습니다.' },
  { title: '레이더 상태', time: '어제 23:12', text: '서재 레이더 연결 상태가 안정적으로 유지되고 있습니다.' },
];

const pageTitles = {
  main: 'Main',
  sleep: '수면 관리',
  posture: '자세 관리',
  home: '가전 제어',
  setting: 'Setting',
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
  const [sleepTab, setSleepTab] = useState('current');
  const [postureTab, setPostureTab] = useState('current');
  const [showNotifications, setShowNotifications] = useState(false);

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
      <Sidebar page={page} onSelect={setPage} />
      <section className="workspace">
        <TopBar
          title={pageTitles[page]}
          today={today}
          showNotifications={showNotifications}
          onToggleNotifications={() => setShowNotifications((value) => !value)}
        />
        <main className="content">
          {page === 'main' && <MainPage />}
          {page === 'sleep' && <SleepPage tab={sleepTab} setTab={setSleepTab} />}
          {page === 'posture' && <PosturePage tab={postureTab} setTab={setPostureTab} />}
          {page === 'home' && <HomeControlPage />}
          {page === 'setting' && <SettingPage />}
        </main>
      </section>
    </div>
  );
}

function Sidebar({ page, onSelect }) {
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
        <button
          className={`nav-item bottom-setting ${page === 'setting' ? 'active' : ''}`}
          onClick={() => onSelect('setting')}
          title={collapsed ? 'Setting' : undefined}
        >
          <span className="nav-icon">⚙</span>
          <span className="nav-label">Setting</span>
          {page === 'setting' && <i />}
        </button>
        <div className="profile">
          <div className="avatar">김</div>
          <div className="profile-text">
            <strong>김건강</strong>
            <span>프리미엄 플랜</span>
          </div>
        </div>
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

function TopBar({ title, today, showNotifications, onToggleNotifications }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{today}</p>
      </div>
      <div className="top-actions">
        <div className="connection">
          <span className="pulse" />
          레이더 연결됨
        </div>
        <button className="bell" aria-label="알림" onClick={onToggleNotifications}>
          <BellIcon />
          <b>2</b>
        </button>
        {showNotifications && <NotificationsPanel />}
        <div className="mini-avatar">김</div>
      </div>
    </header>
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

function MainPage() {
  return (
    <div className="page-stack">
      <section className="hero card">
        <div>
          <p className="eyebrow">WaveHome Care Mode</p>
          <h2>파도에 몸을 맡기듯 당신의 집이 편안하도록, WaveHome</h2>
          <p>레이더 기반 생활 패턴 분석으로 AI Agent가 당신을 돌봅니다.</p>
        </div>
        <img src={logoWithString} alt="WaveHome" />
      </section>

      <section className="main-grid">
        <Card title="Current State" action="실시간">
          <div className="state-grid">
            <Metric label="수면 상태" value="안정" detail="어젯밤 7.0h, 목표 대비 93%" />
            <Metric label="자세 상태" value="주의" detail="거북목 감지 오늘 4회" />
            <Metric label="실내 환경" value="쾌적" detail="온도 24℃ · 조도 낮음" />
            <Metric label="케어 모드" value="Desk" detail="집중 모드 진행 중" />
          </div>
        </Card>

        <Card title="오늘의 Todo" action="4개">
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

      <Card title="어제자 AI Care Report 요약" action="AI">
        <div className="report-grid">
          <ReportItem label="수면" value="수면 점수 84점" text="입면까지 24분, 깊은 수면 비율이 전주 평균보다 8% 높았습니다." />
          <ReportItem label="자세" value="자세 점수 78점" text="오후 3시 이후 목이 앞으로 나오는 패턴이 반복되어 짧은 스트레칭이 권장됩니다." />
          <ReportItem label="추천" value="오늘 액션" text="취침 1시간 전 조명을 낮추고, 50분 착석마다 1분 목 리셋 루틴을 실행하세요." />
        </div>
      </Card>
    </div>
  );
}

function SleepPage({ tab, setTab }) {
  const [wakeAlarmSteps, setWakeAlarmSteps] = useState({
    light: true,
    audio: true,
    tvAlarm: false,
  });
  const toggleWakeAlarmStep = (key) => {
    setWakeAlarmSteps((current) => ({ ...current, [key]: !current[key] }));
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
          <Card title="단계별 기상 알람" action="ON/OFF">
            <div className="wake-alarm-list">
              <WakeAlarmRow
                title="1단계 · 조명 서서히 밝히기"
                time="기상 30분 전"
                on={wakeAlarmSteps.light}
                onToggle={() => toggleWakeAlarmStep('light')}
              />
              <WakeAlarmRow
                title="2단계 · 수면 음악 / 라디오 재생"
                time="기상 15분 전"
                on={wakeAlarmSteps.audio}
                onToggle={() => toggleWakeAlarmStep('audio')}
              />
              <WakeAlarmRow
                title="3단계 · TV 켜기 / 알람 울리기"
                time="기상 시간"
                on={wakeAlarmSteps.tvAlarm}
                onToggle={() => toggleWakeAlarmStep('tvAlarm')}
              />
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

function SleepDailyReport() {
  return (
    <CareReport
      type="daily"
      title="어제의 수면 리포트"
      score="82점"
      summary="새벽 3시 전후 실내 온도 상승과 뒤척임 증가가 얕은 수면 전환으로 이어졌습니다."
      visual={<SleepStageGraph data={sleepStageLog} />}
      analysis={[
        ['수면 점수', '82점', '전일 대비 +4점'],
        ['총 수면 시간', '6h 52m', '목표 7h 30m 대비 -38분'],
        ['입면 시간', '27분', '스마트폰 사용 후 지연'],
        ['뒤척임 집중 시간', '03:05~03:40', '온도 26℃ 이상 구간'],
        ['호흡 패턴', '안정', '코골이 의심 2회'],
        ['수면 부채', '2h 10m', '이번 주 안에 회복 권장'],
      ]}
      insights={[
        ['오늘의 권장 액션', '에어컨 예약을 새벽 4시까지 1시간 연장', '최근 3일간 방 온도가 26℃ 이상일 때 뒤척임이 평소보다 크게 늘었습니다.'],
        ['취침 전 루틴', '23:00 스마트폰 차단 · 23:20 조도 낮춤 · 23:30 취침', '수면 부채가 더 쌓이지 않도록 화면 사용을 줄이고 조도를 먼저 낮추는 순서를 권장합니다.'],
        ['주의사항', '새벽 3시 전후 얕은 수면 전환 가능성', '이 시간대에 온도와 소음 변화가 겹치면 다시 잠드는 시간이 길어질 수 있습니다.'],
        ['자동화 제안', '기상 30분 전 조명 20% → 60%로 서서히 상승', '심박이 안정적으로 올라오는 구간에 빛 자극을 먼저 주면 수면 관성을 줄이는 데 도움이 됩니다.'],
      ]}
    />
  );
}

function CareReport({ type, title, score, summary, analysis, insights, visual, weeklyScores = [], averageScore }) {
  const isWeekly = type === 'weekly';

  return (
    <div className="care-report-layout">
      {visual && (
        <Card title={title} action="Graph" wide>
          <p className="report-summary-only">{summary}</p>
          {visual}
        </Card>
      )}
      {isWeekly && (
        <Card title={title} action={score} wide>
          <p className="report-summary-only">{summary}</p>
          <div className="weekly-score-chart">
            <div className="weekly-score-bars">
              {weeklyScores.map(([day, value]) => (
                <div className="weekly-score-bar" key={day} tabIndex={0}>
                  <div className="weekly-score-track">
                    <i style={{ height: `${value}%` }} />
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
          <Card title="현재 자세상태" action="실시간">
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

function SettingPage() {
  const [settings, setSettings] = useState({
    radar: true,
    sleepPrep: true,
    dawnAlarm: true,
    smartphoneBlock: true,
    postureVoice: true,
    postureRest: true,
    iotConfirm: false,
    aiReport: true,
    localOnly: true,
  });
  const toggleSetting = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="settings-page">
      <section className="settings-hero card">
        <div>
          <p className="eyebrow">WaveHome Settings</p>
          <h2>수면, 자세, 가전 제어가 같은 리듬으로 움직이도록 설정합니다.</h2>
          <span>현재 프로필: 김건강 · 프리미엄 플랜 · 로컬 우선 저장</span>
        </div>
      </section>

      <div className="settings-grid">
        <Card title="레이더 / 공간">
          <InfoList
            items={[
              ['연결 상태', '방 1 · 방 2 · 서재 연결됨'],
              ['감지 민감도', '중간 · 자세/제스처 공통'],
              ['야간 모드', '23:00 이후 저전력 감지'],
            ]}
          />
          <SettingToggle label="레이더 자동 재연결" desc="연결이 끊기면 10초 간격으로 재시도합니다." on={settings.radar} onToggle={() => toggleSetting('radar')} />
        </Card>

        <Card title="AI 리포트 / 데이터">
          <InfoList
            items={[
              ['일간 리포트 생성', '매일 오전 8시'],
              ['주간 리포트 생성', '월요일 오전 8시'],
              ['보관 기간', '최근 90일'],
            ]}
          />
          <SettingToggle label="AI Care Report 자동 생성" desc="수면/자세 핵심 분석과 인사이트를 자동 정리합니다." on={settings.aiReport} onToggle={() => toggleSetting('aiReport')} />
        </Card>

        <Card title="계정 / 접근">
          <InfoList
            items={[
              ['사용자', '김건강'],
              ['권한', '관리자'],
              ['마지막 동기화', '오늘 21:42'],
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

function SettingToggle({ label, desc, on, onToggle }) {
  return (
    <div className="setting-toggle-row">
      <div>
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <button type="button" className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} aria-label={`${label} 토글`}>
        <i />
      </button>
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

function Card({ title, action, children, wide }) {
  return (
    <section className={`card ${wide ? 'wide' : ''}`}>
      <div className="card-head">
        <h3>{title}</h3>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function ReportItem({ label, value, text }) {
  return (
    <div className="report-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
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
