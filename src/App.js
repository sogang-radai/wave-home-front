import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { pageTitles } from './data/appData';
import chatApi from './api/chatApi';
import settingsApi from './api/settingsApi';
import weeklyPlanApi from './api/weeklyPlanApi';
import { InsightChat } from './pages/chat/InsightChat';
import { ChatPopup } from './pages/chat/ChatPopup';
import { ChatPage } from './pages/chat/ChatPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MainPage } from './pages/MainPage';
import { SleepPage } from './pages/sleep/SleepPage';
import { PosturePage } from './pages/posture/PosturePage';
import { WeeklyPlanPage } from './pages/plan/WeeklyPlanPage';
import { AlarmPage } from './pages/alarm/AlarmPage';
import { HomeControlPage } from './pages/iot/HomeControlPage';
import { PowerPage } from './pages/power/PowerPage';
import { SettingPage } from './pages/settings/SettingPage';
import {
  listenPushNavigation,
  resolvePushUrlToPage,
  syncBrowserPush,
} from './push/browserPush';
import { getNow } from './lib/demoClock';
import { IS_DEMO_MODE } from './api/config';

function formatNotificationTime(iso) {
  const date = new Date(iso);
  const now = getNow();
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

// weekly-plan.md의 Task(dayOfWeek/category/startMinute/endMinute)를 캘린더 화면이 이미 쓰던
// 뷰 모델(day/cat/startMin/endMin, 한글 요일·카테고리)로 변환한다.
const DAY_TO_KOREAN = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
const KOREAN_TO_DAY = { 월: 'mon', 화: 'tue', 수: 'wed', 목: 'thu', 금: 'fri', 토: 'sat', 일: 'sun' };
const CATEGORY_TO_KOREAN = { posture: '자세', sleep: '수면', diet: '식습관', mental: '멘탈' };
const KOREAN_TO_CATEGORY = { 자세: 'posture', 수면: 'sleep', 식습관: 'diet', 멘탈: 'mental', 일정: 'mental' };

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toViewTodo(task) {
  return {
    id: task.id,
    title: task.title,
    done: task.done,
    day: DAY_TO_KOREAN[task.dayOfWeek],
    cat: CATEGORY_TO_KOREAN[task.category] || '멘탈',
    sourceInsightId: task.sourceInsightId ?? null,
    ...(task.startMinute !== undefined ? { startMin: task.startMinute, endMin: task.endMinute } : {}),
  };
}

function App() {
  const [page, setPage] = useState('main');
  const [postureTab, setPostureTab] = useState('current');
  const [homeTab, setHomeTab] = useState('control');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    settingsApi
      .getNotifications()
      .then((list) => setNotifications(list.map(toViewNotification)))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    settingsApi
      .getGeneralSettings()
      .then((cfg) => {
        if (cfg?.browserPushEnabled) {
          syncBrowserPush(true).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return listenPushNavigation((url) => {
      const nextPage = resolvePushUrlToPage(url);
      if (nextPage === 'chat') {
        setChatMode('page');
        setPage('chat');
        return;
      }
      setPage(nextPage);
    });
  }, []);

  const markAllNotificationsRead = async () => {
    const updated = await settingsApi.markAllNotificationsRead();
    if (!updated) return;
    setNotifications(updated.map(toViewNotification));
  };
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    weeklyPlanApi
      .getTasks()
      .then((tasks) => setTodos(Array.isArray(tasks) ? tasks.map(toViewTodo) : []))
      .catch(() => setTodos([]));
  }, []);

  const toggleTodo = async (id) => {
    const current = todos.find((item) => item.id === id);
    if (!current) return;
    const updated = await weeklyPlanApi.updateTask(id, { done: !current.done });
    if (!updated) return;
    setTodos((prev) => prev.map((item) => (item.id === id ? toViewTodo(updated) : item)));
  };
  const addTodo = async (title, day, startMin, endMin, options = {}) => {
    const {
      category,
      repeatWeekly = true,
      eventDate,
      eventDates,
      days,
    } = options;
    const targetDays = days?.length ? days : [day];
    const createdTasks = [];
    for (const targetDay of targetDays) {
      const payload = {
        title,
        dayOfWeek: KOREAN_TO_DAY[targetDay],
        scheduleKind: repeatWeekly ? 'weekly' : 'once',
        ...(repeatWeekly ? {} : { eventDate: eventDates?.[targetDay] || eventDate || formatDateParam(getNow()) }),
        ...(category ? { category: KOREAN_TO_CATEGORY[category] } : {}),
        ...(startMin !== undefined ? { startMinute: startMin, endMinute: endMin } : {}),
      };
      // eslint-disable-next-line no-await-in-loop
      const created = await weeklyPlanApi.createTask(payload);
      if (!created) return createdTasks;
      createdTasks.push(created);
    }
    setTodos((prev) => [...prev, ...createdTasks.map(toViewTodo)]);
    return createdTasks;
  };
  const addTodoFromInsight = async (insightId, day) => {
    const created = await weeklyPlanApi.createTask({
      sourceInsightId: insightId,
      dayOfWeek: KOREAN_TO_DAY[day],
    });
    if (!created) return null;
    setTodos((prev) => [...prev, toViewTodo(created)]);
    return created;
  };
  const updateTodo = async (id, changes) => {
    const payload = {};
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.done !== undefined) payload.done = changes.done;
    if (changes.cat !== undefined) payload.category = KOREAN_TO_CATEGORY[changes.cat];
    if (changes.day !== undefined) payload.dayOfWeek = KOREAN_TO_DAY[changes.day];
    if (changes.startMin !== undefined) payload.startMinute = changes.startMin;
    if (changes.endMin !== undefined) payload.endMinute = changes.endMin;
    const updated = await weeklyPlanApi.updateTask(id, payload);
    if (!updated) return;
    setTodos((prev) => prev.map((item) => (item.id === id ? toViewTodo(updated) : item)));
  };
  const deleteTodo = async (id) => {
    await weeklyPlanApi.deleteTask(id);
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };
  const [settingCategory, setSettingCategory] = useState('general');
  const [showDevSettings, setShowDevSettings] = useState(false);
  const goToPowerAnalysis = () => {
    setPage('power');
  };

  const goToChatWithDraft = (text) => {
    setActiveChatId(null);
    setChatMode('page');
    setPendingChatDraft(text);
    setPrevPage(page);
    playBubbleTransitionSound();
    setPage('chat');
    setWaveTransition(true);
    setTimeout(() => {
      setWaveTransition(false);
    }, 750);
  };
  const [chatConversations, setChatConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    chatApi
      .getConversations()
      .then((list) => setChatConversations(Array.isArray(list) ? list : []))
      .catch(() => setChatConversations([]));
  }, []);
  const [waveTransition, setWaveTransition] = useState(false);
  const bubbleAudioCtxRef = useRef(null);
  const [chatMode, setChatMode] = useState('page'); // 'page' | 'popup' | 'mini'
  const [prevPage, setPrevPage] = useState('main');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // One-shot flag: force the popup to open snapped to the top-right corner
  // (used by the header WaveAI button). Consumed once by ChatPopup on mount.
  const [chatForceTopRight, setChatForceTopRight] = useState(false);
  const [pendingChatDraft, setPendingChatDraft] = useState(null);

  const playBubbleTransitionSound = async () => {
    // Read waveAiSound fresh on every call so setting changes apply immediately
    const aiSettings = await settingsApi.getAiAgentSettings();
    if (!aiSettings.waveAiSound) return;
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

  const mergeChatConversation = (conversation) => {
    setChatConversations((prev) => {
      const exists = prev.some((item) => item.id === conversation.id);
      return exists
        ? prev.map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
        : [conversation, ...prev];
    });
  };

  const selectChatConversation = async (id) => {
    setActiveChatId(id);
    try {
      const conversation = await chatApi.getConversation(id);
      mergeChatConversation(conversation);
    } catch {
      // Keep the id selected; detail load may fail transiently on refresh.
    }
  };

  const handleNavigateToChat = () => {
    if (chatMode === 'popup' || chatMode === 'mini') {
      // Keep current selection; only play the welcome transition when opening a new chat.
      if (!activeChatId) {
        playBubbleTransitionSound();
        setWaveTransition(true);
        setTimeout(() => setWaveTransition(false), 750);
      }
      setChatMode('page');
      setPage('chat');
      return;
    }
    if (page === 'chat') {
      // Already on chat page — start a new conversation (welcome)
      setActiveChatId(null);
      return;
    }
    setPrevPage(page);
    setPage('chat');
    // Never auto-select a conversation. Welcome (no selection) gets the bubble effect;
    // returning to an already-selected conversation does not.
    if (!activeChatId) {
      playBubbleTransitionSound();
      setWaveTransition(true);
      setTimeout(() => setWaveTransition(false), 750);
    }
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

  // Header "WaveAI" button — opens a fresh mini chat snapped to the top-right
  // corner. No conversation is created yet — it only enters the list once the
  // first message is actually sent (see sendChatMessage's `user_added` handling).
  const handleHeaderWaveAiOpen = () => {
    setActiveChatId(null);
    setChatForceTopRight(true);
    setChatMode('mini');
  };

  // "새 대화" only clears the active selection (welcome screen) — it doesn't
  // join the conversation list until the user actually sends a message.
  const addChatConversation = () => {
    setActiveChatId(null);
  };

  const deleteChatConversation = async (id) => {
    await chatApi.deleteConversation(id);
    setChatConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const renameChatConversation = async (id, title) => {
    const conversation = await chatApi.renameConversation(id, title);
    setChatConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...conversation } : c)));
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;

    chatApi.sendMessageStreaming(activeChatId, text.trim(), {
      onEvent: (evt) => {
        if (evt.type === 'user_added') {
          // If no active conversation, register the new one and set it active
          setActiveChatId(evt.conversationId);
          setChatConversations((prev) => {
            const exists = prev.some((c) => c.id === evt.conversationId);
            const summary = {
              id: evt.conversationId,
              title: evt.conversation?.title || text.trim().slice(0, 22),
              messages: [evt.message],
              lastMessagePreview: evt.message.text,
              messageCount: 1,
              createdAt: evt.conversation?.createdAt,
              updatedAt: evt.conversation?.updatedAt,
            };
            return exists
              ? prev.map((c) =>
                  c.id === evt.conversationId
                    ? { ...c, messages: [...(c.messages || []), evt.message] }
                    : c
                )
              : [summary, ...prev];
          });
        } else if (evt.type === 'assistant_start') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? { ...c, messages: [...(c.messages || []), evt.message] }
                : c
            )
          );
        } else if (evt.type === 'tool_start' || evt.type === 'tool_end') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    messages: (c.messages || []).map((m) =>
                      m.id === evt.messageId
                        ? {
                            ...m,
                            toolEvents: (() => {
                              const existing = m.toolEvents || [];
                              const idx = existing.findIndex((t) => t.name === evt.toolEvent.name);
                              if (idx >= 0) {
                                return existing.map((t, i) => (i === idx ? evt.toolEvent : t));
                              }
                              return [...existing, evt.toolEvent];
                            })(),
                          }
                        : m
                    ),
                  }
                : c
            )
          );
        } else if (evt.type === 'assistant_status') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    messages: (c.messages || []).map((m) =>
                      m.id === evt.messageId ? { ...m, activityPhase: evt.phase } : m
                    ),
                  }
                : c
            )
          );
        } else if (evt.type === 'reasoning_delta') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    messages: (c.messages || []).map((m) =>
                      m.id === evt.messageId ? { ...m, reasoning: evt.reasoning, showReasoning: true } : m
                    ),
                  }
                : c
            )
          );
        } else if (evt.type === 'content_delta') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    messages: (c.messages || []).map((m) =>
                      m.id === evt.messageId ? { ...m, text: evt.text } : m
                    ),
                  }
                : c
            )
          );
        } else if (evt.type === 'message_done') {
          setChatConversations((prev) =>
            prev.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    messages: (c.messages || []).map((m) =>
                      m.id === evt.messageId
                        ? { ...m, status: 'done', text: evt.text, activityPhase: undefined }
                        : m
                    ),
                    lastMessagePreview: evt.text,
                  }
                : c
            )
          );
        }
      },
    });
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
      }).format(getNow()),
    [],
  );

  if (!account) {
    return <div className="app-shell" />;
  }

  return (
    <div className="app-shell">
      {IS_DEMO_MODE && (
        <div className="demo-mode-banner" role="status">
          시연 모드 — 날짜는 고정되며 변경 사항은 저장되지 않습니다.
        </div>
      )}
      <InsightChat open={false} onClose={() => {}} />
      {(chatMode === 'popup' || chatMode === 'mini') && (
        <ChatPopup
          mode={chatMode}
          conversations={chatConversations}
          activeConvId={activeChatId}
          onSelectConv={selectChatConversation}
          onAddConv={addChatConversation}
          onDeleteConv={deleteChatConversation}
          onRenameConv={renameChatConversation}
          onSendMessage={sendChatMessage}
          onExpand={handleExpandChat}
          onMini={handleMiniChat}
          onClose={handleClosePopupChat}
          sidebarWidth={sidebarCollapsed ? 76 : 263}
          forceTopRight={chatForceTopRight}
          onForceTopRightConsumed={() => setChatForceTopRight(false)}
        />
      )}
      <Sidebar
        page={page}
        onSelect={setPage}
        onNavigateToChat={handleNavigateToChat}
        today={today}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications((value) => !value)}
        onCloseNotifications={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        accounts={accounts}
        account={account}
        onSwitchAccount={switchAccount}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onUnlockDevMenu={() => setShowDevSettings(true)}
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
          onOpenWaveAi={handleHeaderWaveAiOpen}
          waveAiDisabled={chatMode !== 'page' || page === 'chat'}
        />
        <main className={`content${page === 'chat' && chatMode === 'page' ? ' chat-active' : ''}`}>
          {page === 'main' && (
            <MainPage
              onNavigate={setPage}
              todos={todos}
              onToggleTodo={toggleTodo}
              onGoToPowerAnalysis={goToPowerAnalysis}
              onOpenChatWithDraft={goToChatWithDraft}
            />
          )}
          {page === 'sleep' && (
            <SleepPage />
          )}
          {page === 'posture' && <PosturePage tab={postureTab} setTab={setPostureTab} />}
          {page === 'weeklyPlan' && (
            <WeeklyPlanPage
              todos={todos}
              onToggleTodo={toggleTodo}
              onAddTodo={addTodo}
              onUpdateTodo={updateTodo}
              onDeleteTodo={deleteTodo}
              onAddTodoFromInsight={addTodoFromInsight}
            />
          )}
          {page === 'alarm' && <AlarmPage />}
          {page === 'power' && <PowerPage />}
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
              showDevSettings={showDevSettings}
            />
          )}
          {page === 'chat' && chatMode === 'page' && (
            <ChatPage
              conversations={chatConversations}
              activeConvId={activeChatId}
              onSelectConv={selectChatConversation}
              onAddConv={addChatConversation}
              onDeleteConv={deleteChatConversation}
              onRenameConv={renameChatConversation}
              onSendMessage={sendChatMessage}
              onShrink={handleShrinkChat}
              waveTransition={waveTransition}
              sidebarWidth={sidebarCollapsed ? 76 : 263}
              initialDraft={pendingChatDraft}
              onConsumeInitialDraft={() => setPendingChatDraft(null)}
            />
          )}
        </main>
      </section>
    </div>
  );
}

export default App;
