import { delay, cloneDeep, nextNumericId } from './utils';
import { insightSuggestions, CHAT_SUGGESTION_POOL, initialChatConversations, getInsightReply } from '../../data/chatData';

class MockApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

function apiError(status, code, message, extra) {
  return new MockApiError(status, code, message, extra);
}

function nowIso(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

function createMessage(role, text, offsetSeconds = 0) {
  return {
    id: nextNumericId(),
    role,
    text,
    createdAt: nowIso(offsetSeconds),
  };
}

function normalizeConversation(conversation, index) {
  const createdAt = conversation.createdAt || new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString();
  const messages = conversation.messages.map((message, messageIndex) => ({
    id: message.id || nextNumericId(),
    role: message.role,
    text: message.text,
    createdAt: message.createdAt || new Date(new Date(createdAt).getTime() + messageIndex * 60 * 1000).toISOString(),
  }));
  return {
    id: conversation.id,
    title: conversation.title,
    messages,
    createdAt,
    updatedAt: conversation.updatedAt || messages[messages.length - 1]?.createdAt || createdAt,
  };
}

function toSummary(conversation) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return {
    id: conversation.id,
    title: conversation.title,
    lastMessagePreview: lastMessage?.text || null,
    messageCount: conversation.messages.length,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function titleFromMessage(text) {
  return text.length > 22 ? `${text.slice(0, 22)}…` : text;
}

function requireText(text) {
  const trimmed = text?.trim();
  if (!trimmed) throw apiError(400, 'INVALID_MESSAGE', '메시지를 입력해주세요.', { field: 'text' });
  if (trimmed.length > 2000) throw apiError(400, 'MESSAGE_TOO_LONG', '메시지는 2000자 이하로 입력해주세요.', { field: 'text' });
  return trimmed;
}

// 메모리에만 보관되는 mock 상태. 새로고침하면 초기 데이터로 리셋된다.
let conversations = cloneDeep(initialChatConversations).map(normalizeConversation);

/** 테스트·데모 빌드에서 대화 목록 시드를 교체한다. */
export function resetChatConversations(seed = []) {
  conversations = cloneDeep(seed).map((conversation, index) => normalizeConversation(conversation, index));
}

export class ChatApi {
  async getConversations() {
    await delay();
    return cloneDeep(conversations.map(toSummary));
  }

  async getConversation(conversationId) {
    await delay();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) throw apiError(404, 'NOT_FOUND', '대화를 찾을 수 없습니다.');
    return cloneDeep(conversation);
  }

  async createConversation(input = {}) {
    await delay();
    const payload = typeof input === 'string' ? { title: input } : input;
    const initialMessage = payload.initialMessage?.trim();
    const title = payload.title?.trim() || (initialMessage ? titleFromMessage(initialMessage) : '새 대화');
    if (!title && !initialMessage) throw apiError(400, 'INVALID_TITLE', '대화 제목 또는 첫 메시지를 입력해주세요.', { field: 'title' });

    const createdAt = nowIso();
    const messages = [];
    let updatedAt = createdAt;
    if (initialMessage) {
      const userMessage = createMessage('user', initialMessage);
      const assistantMessage = createMessage('assistant', getInsightReply(initialMessage), 2);
      messages.push(userMessage, assistantMessage);
      updatedAt = assistantMessage.createdAt;
    }

    const conversation = { id: nextNumericId(), title, messages, createdAt, updatedAt };
    conversations = [conversation, ...conversations];
    return cloneDeep(conversation);
  }

  async startConversation(text) {
    return this.createConversation({ initialMessage: text });
  }

  async renameConversation(conversationId, title) {
    await delay();
    const nextTitle = title?.trim();
    if (!nextTitle) throw apiError(400, 'INVALID_TITLE', '대화 제목을 입력해주세요.', { field: 'title' });
    conversations = conversations.map((c) => (c.id === conversationId ? { ...c, title: nextTitle } : c));
    const updated = conversations.find((c) => c.id === conversationId);
    if (!updated) throw apiError(404, 'NOT_FOUND', '대화를 찾을 수 없습니다.');
    return cloneDeep(toSummary(updated));
  }

  async deleteConversation(conversationId) {
    await delay();
    if (!conversations.some((c) => c.id === conversationId)) throw apiError(404, 'NOT_FOUND', '대화를 찾을 수 없습니다.');
    conversations = conversations.filter((c) => c.id !== conversationId);
  }

  async sendMessage(conversationId, text) {
    await delay();
    const trimmed = requireText(text);
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) throw apiError(404, 'NOT_FOUND', '대화를 찾을 수 없습니다.');

    const userMessage = createMessage('user', trimmed);
    const assistantMessage = createMessage('assistant', getInsightReply(trimmed), 2);
    const appendedMessages = [userMessage, assistantMessage];
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, ...appendedMessages],
      updatedAt: assistantMessage.createdAt,
    };
    conversations = conversations.map((c) => (c.id === conversationId ? updatedConversation : c));

    return {
      conversationId,
      appendedMessages: cloneDeep(appendedMessages),
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        updatedAt: updatedConversation.updatedAt,
      },
    };
  }

  // Streaming simulation: calls onEvent with incremental events
  // Supports '수면 테스트' special scenario with tool calls + reasoning
  sendMessageStreaming(conversationId, text, { onEvent, onComplete, onError }) {
    const trimmed = requireText(text);
    const isSleepTest = trimmed.includes('수면 테스트');

    // Find or create conversation
    let conv = conversationId ? conversations.find((c) => c.id === conversationId) : null;
    if (!conv) {
      const createdAt = nowIso();
      conv = { id: nextNumericId(), title: titleFromMessage(trimmed), messages: [], createdAt, updatedAt: createdAt };
      conversations = [conv, ...conversations];
    }

    const userMsg = createMessage('user', trimmed);
    const assistantId = nextNumericId();
    const assistantShell = {
      id: assistantId,
      role: 'assistant',
      text: '',
      status: 'streaming',
      reasoning: null,
      toolEvents: [],
      createdAt: nowIso(1),
    };

    // Append user message to store
    conversations = conversations.map((c) =>
      c.id === conv.id ? { ...c, messages: [...c.messages, userMsg] } : c
    );

    onEvent({ type: 'user_added', conversationId: conv.id, conversation: cloneDeep(conv), message: cloneDeep(userMsg) });
    onEvent({ type: 'assistant_start', conversationId: conv.id, message: cloneDeep(assistantShell) });

    let accumulated = '';
    let accumulatedReasoning = '';

    const schedule = (ms, fn) => setTimeout(fn, ms);
    const timers = [];

    const emit = (ms, fn) => {
      timers.push(schedule(ms, fn));
    };

    if (isSleepTest) {
      // Phase 1: tool call start
      emit(320, () => {
        onEvent({
          type: 'tool_start',
          conversationId: conv.id,
          messageId: assistantId,
          toolEvent: { name: 'sleep_data_search', status: 'running', label: '수면 데이터 조회 중' },
        });
      });
      // Phase 2: tool call end
      emit(900, () => {
        onEvent({
          type: 'tool_end',
          conversationId: conv.id,
          messageId: assistantId,
          toolEvent: { name: 'sleep_data_search', status: 'done', label: '수면 데이터 조회 완료' },
        });
      });
      // Phase 3: reasoning deltas
      const reasoningChunks = [
        '사용자의 수면 데이터를 확인했습니다. ',
        '최근 7일간 평균 수면 시간은 6.2시간으로 권장 수면 시간(7-9시간)보다 부족합니다. ',
        '수면 단계 분포를 보면 깊은 수면(N3)이 전체의 18%로 이상적인 20-25% 범위보다 낮습니다. ',
        '이를 바탕으로 개선 방안을 제안해야겠습니다.',
      ];
      reasoningChunks.forEach((chunk, i) => {
        emit(1100 + i * 120, () => {
          accumulatedReasoning += chunk;
          onEvent({
            type: 'reasoning_delta',
            conversationId: conv.id,
            messageId: assistantId,
            reasoning: accumulatedReasoning,
          });
        });
      });
      // Phase 4: content deltas
      const contentChunks = [
        '최근 7일간 수면 데이터를 분석했습니다.\n\n',
        '**수면 현황 요약**\n- 평균 수면 시간: **6.2시간** (권장: 7-9시간)\n- 깊은 수면 비율: **18%** (권장: 20-25%)\n- 수면 효율: **82%**\n\n',
        '**주요 문제점**\n1. 취침 시간이 불규칙해 수면 리듬이 흐트러져 있습니다.\n2. 깊은 수면 단계가 부족해 피로 회복이 원활하지 않습니다.\n\n',
        '**개선 권장 사항**\n- 매일 같은 시간에 취침·기상하세요.\n- 취침 1시간 전 블루라이트(스마트폰·TV)를 줄이세요.\n- 가벼운 스트레칭이나 호흡 운동을 취침 루틴에 포함해보세요.\n',
        '지속적인 수면 관리가 필요하면 수면 루틴 설정 기능을 활용해 보세요! 💤',
      ];
      contentChunks.forEach((chunk, i) => {
        emit(1700 + i * 280, () => {
          accumulated += chunk;
          onEvent({
            type: 'content_delta',
            conversationId: conv.id,
            messageId: assistantId,
            text: accumulated,
          });
        });
      });
      // Phase 5: done
      emit(1700 + contentChunks.length * 280 + 100, () => {
        const finalMsg = { ...assistantShell, text: accumulated, reasoning: accumulatedReasoning, status: 'done', toolEvents: [] };
        conversations = conversations.map((c) =>
          c.id === conv.id ? { ...c, messages: [...c.messages, finalMsg], updatedAt: finalMsg.createdAt } : c
        );
        onEvent({ type: 'message_done', conversationId: conv.id, messageId: assistantId, text: accumulated });
        onComplete && onComplete();
      });
    } else {
      // Normal fast response
      const reply = getInsightReply(trimmed);
      const chunks = [];
      // Split reply into ~4 chunks
      const chunkSize = Math.ceil(reply.length / 4);
      for (let i = 0; i < reply.length; i += chunkSize) {
        chunks.push(reply.slice(i, i + chunkSize));
      }
      chunks.forEach((chunk, i) => {
        emit(200 + i * 180, () => {
          accumulated += chunk;
          onEvent({
            type: 'content_delta',
            conversationId: conv.id,
            messageId: assistantId,
            text: accumulated,
          });
        });
      });
      emit(200 + chunks.length * 180 + 80, () => {
        const finalMsg = { ...assistantShell, text: accumulated, status: 'done', toolEvents: [] };
        conversations = conversations.map((c) =>
          c.id === conv.id ? { ...c, messages: [...c.messages, finalMsg], updatedAt: finalMsg.createdAt } : c
        );
        onEvent({ type: 'message_done', conversationId: conv.id, messageId: assistantId, text: accumulated });
        onComplete && onComplete();
      });
    }

    // Return cancellation function
    return () => timers.forEach(clearTimeout);
  }

  async getSuggestions() {
    await delay(150);
    return {
      insightSuggestions: insightSuggestions.map((prompt, index) => ({
        id: `sug_insight_${index + 1}`,
        label: prompt,
        prompt,
      })),
      suggestionPool: CHAT_SUGGESTION_POOL.map((item, index) => ({
        id: `sug_welcome_${index + 1}`,
        ...item,
      })),
    };
  }

  // 대화 이력과 무관한 1회성 인사이트 질문 (InsightChat 위젯 전용)
  async askInsight(text) {
    await delay(200);
    const trimmed = requireText(text);
    return { reply: getInsightReply(trimmed) };
  }
}
