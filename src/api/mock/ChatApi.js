import { delay, cloneDeep, makeId } from './utils';
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
    id: makeId('msg'),
    role,
    text,
    createdAt: nowIso(offsetSeconds),
  };
}

function normalizeConversation(conversation, index) {
  const createdAt = conversation.createdAt || new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString();
  const messages = conversation.messages.map((message, messageIndex) => ({
    id: message.id || makeId('msg'),
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

    const conversation = { id: makeId('chat'), title, messages, createdAt, updatedAt };
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
