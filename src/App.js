import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import ApprovedActionsContext from './context/ApprovedActionsContext';
import { pageTitles } from './data/appData';
import { initialTodos } from './data/weeklyPlanData';
import chatApi from './api/chatApi';
import settingsApi from './api/settingsApi';
import { WaveTransitionOverlay } from './WaveTransitionOverlay';
import { InsightChat } from './chat/InsightChat';
import { ChatPopup } from './chat/ChatPopup';
import { ChatPage } from './chat/ChatPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MainPage } from './pages/MainPage';
import { OverviewPage } from './pages/OverviewPage';
import { SleepPage } from './pages/sleep/SleepPage';
import { PosturePage } from './pages/posture/PosturePage';
import { WeeklyPlanPage } from './pages/WeeklyPlanPage';
import { HomeControlPage } from './pages/HomeControlPage';
import { SettingPage } from './pages/settings/SettingPage';

function formatNotificationTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  if (now - date < 60 * 1000) return '방금 전';

  const time = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  if (date.toDateString() === now.toDateString()) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `어제 ${time}`;

  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

function toViewNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    msg: notification.message,
    time: formatNotificationTime(notification.createdAt),
    read: notification.read,
  };
}

function App() {
  const [page, setPage] = useState('main');
  const [sleepTab, setSleepTab] = useState('report');
  const [postureTab, setPostureTab] = useState('current');
  const [homeTab, setHomeTab] = useState('history');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    settingsApi.getNotifications().then((list) => setNotifications(list.map(toViewNotification)));
  }, []);

  const markAllNotificationsRead = async () => {
    const updated = await settingsApi.markAllNotificationsRead();
    setNotifications(updated.map(toViewNotification));
  };
  const [todos, setTodos] = useState(initialTodos);
  const toggleTodo = (id) => {
    setTodos((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };
  const addTodo = (title, day, cat, startMin, endMin) => {
    setTodos((current) => [...current, { id: Date.now(), title, done: false, day, cat, ...(startMin !== undefined ? { startMin, endMin } : {}) }]);
  };
  const updateTodo = (id, changes) => {
    setTodos((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
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
  const goToPowerAnalysis = () => {
    setHomeTab('power');
    setPage('home');
  };
  const [chatConversations, setChatConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    chatApi.getConversations().then(setChatConversations);
  }, []);
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
    setSidebarCollapsed(false);
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

  const addChatConversation = async () => {
    const conversation = await chatApi.createConversation();
    setChatConversations((prev) => [conversation, ...prev]);
    setActiveChatId(conversation.id);
  };

  const deleteChatConversation = async (id) => {
    await chatApi.deleteConversation(id);
    setChatConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const renameChatConversation = async (id, title) => {
    const conversation = await chatApi.renameConversation(id, title);
    setChatConversations((prev) => prev.map((c) => (c.id === id ? conversation : c)));
  };

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;
    const wasNewConversation = !activeChatId;
    const conversation = await chatApi.sendMessage(activeChatId, text.trim());
    setChatConversations((prev) =>
      wasNewConversation
        ? [conversation, ...prev]
        : prev.map((c) => (c.id === conversation.id ? conversation : c))
    );
    if (wasNewConversation) setActiveChatId(conversation.id);
  };
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const account = accounts.find((item) => item.id === accountId) || accounts[0] || null;

  useEffect(() => {
    Promise.all([settingsApi.getSession(), settingsApi.getAccounts()]).then(([session, accountList]) => {
      setAccounts(accountList);
      setAccountId(session.activeAccount?.id || accountList[0]?.id || null);
    });
  }, []);

  const switchAccount = (id) => {
    setAccountId(id);
    settingsApi.switchActiveAccount(id);
  };
  const renameAccount = async (id, name) => {
    const updated = await settingsApi.updateAccount(id, { name });
    setAccounts((current) => current.map((item) => (item.id === id ? updated : item)));
  };
  const addAccount = async (name) => {
    const created = await settingsApi.createAccount({ name });
    setAccounts((current) => [...current, created]);
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

  if (!account) {
    return <div className="app-shell" />;
  }

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
          onSwitchAccount={switchAccount}
          showInsightChat={page === 'chat'}
          onToggleInsightChat={handleNavigateToChat}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
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
            onSwitchAccount={switchAccount}
          />
          <main className={`content${page === 'chat' && chatMode === 'page' ? ' chat-active' : ''}`}>
            {page === 'main' && (
              <MainPage
                onNavigate={setPage}
                todos={todos}
                onToggleTodo={toggleTodo}
                onGoToSleepSettings={goToSleepSettings}
                onGoToPowerAnalysis={goToPowerAnalysis}
              />
            )}
            {page === 'overview' && <OverviewPage onNavigate={setPage} />}
            {page === 'sleep' && (
              <SleepPage tab={sleepTab} setTab={setSleepTab} onGoToSleepSettings={goToSleepSettings} />
            )}
            {page === 'posture' && <PosturePage tab={postureTab} setTab={setPostureTab} />}
            {page === 'weeklyPlan' && <WeeklyPlanPage todos={todos} onToggleTodo={toggleTodo} onAddTodo={addTodo} onUpdateTodo={updateTodo} />}
            {page === 'home' && <HomeControlPage tab={homeTab} setTab={setHomeTab} />}
            {page === 'setting' && (
              <SettingPage
                accounts={accounts}
                accountId={accountId}
                account={account}
                onSwitchAccount={switchAccount}
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

export default App;
