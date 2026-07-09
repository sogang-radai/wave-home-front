import {
  ChatApi as MockChatApi,
  resetChatConversations,
  isSeedConversationId,
  findStoredConversation,
  getStoredConversations,
  replaceStoredConversations,
} from '../mock/ChatApi';
import { initialChatConversations } from '../../data/chatData';
import { streamSse } from '../v1/httpClient';
import { cloneDeep, nextNumericId } from '../mock/utils';

resetChatConversations(initialChatConversations);

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

function titleFromMessage(text) {
  return text.length > 22 ? `${text.slice(0, 22)}…` : text;
}

function requireText(text) {
  const trimmed = text?.trim();
  if (!trimmed) {
    const err = new Error('메시지를 입력해주세요.');
    err.status = 400;
    err.code = 'INVALID_MESSAGE';
    throw err;
  }
  if (trimmed.length > 2000) {
    const err = new Error('메시지는 2000자 이하로 입력해주세요.');
    err.status = 400;
    err.code = 'MESSAGE_TOO_LONG';
    throw err;
  }
  return trimmed;
}

function toAgentMessages(messages) {
  return messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.text?.trim())
    .map((m) => ({ role: m.role, text: m.text }));
}

const mockApi = new MockChatApi();

/**
 * Demo chat: seeded conversation list (read-only samples) + ephemeral real agent streaming.
 * Sending a message never writes to the backend DB; only the agent turn is proxied.
 */
export class ChatApi {
  getConversations() {
    return mockApi.getConversations();
  }

  getConversation(conversationId) {
    return mockApi.getConversation(conversationId);
  }

  createConversation(input = {}) {
    return mockApi.createConversation(input);
  }

  startConversation(text) {
    return mockApi.startConversation(text);
  }

  renameConversation(conversationId, title) {
    return mockApi.renameConversation(conversationId, title);
  }

  deleteConversation(conversationId) {
    return mockApi.deleteConversation(conversationId);
  }

  sendMessage(conversationId, text) {
    return mockApi.sendMessage(conversationId, text);
  }

  getSuggestions() {
    return mockApi.getSuggestions();
  }

  askInsight(text) {
    return mockApi.askInsight(text);
  }

  sendMessageStreaming(conversationId, text, { onEvent, onComplete, onError } = {}) {
    let trimmed;
    try {
      trimmed = requireText(text);
    } catch (err) {
      onError?.(err);
      return () => {};
    }

    let convId = conversationId;
    let isNewConversation = false;

    if (!convId || isSeedConversationId(convId)) {
      const createdAt = nowIso();
      const conv = {
        id: nextNumericId(),
        title: titleFromMessage(trimmed),
        messages: [],
        createdAt,
        updatedAt: createdAt,
      };
      replaceStoredConversations([conv, ...getStoredConversations()]);
      convId = conv.id;
      isNewConversation = true;
    }

    const conv = findStoredConversation(convId);
    if (!conv) {
      onError?.(Object.assign(new Error('대화를 찾을 수 없습니다.'), { status: 404, code: 'NOT_FOUND' }));
      return () => {};
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

    const updatedConv = {
      ...conv,
      messages: [...conv.messages, userMsg],
      updatedAt: userMsg.createdAt,
    };
    replaceStoredConversations(
      getStoredConversations().map((c) => (c.id === convId ? updatedConv : c))
    );

    onEvent({
      type: 'user_added',
      conversationId: convId,
      ...(isNewConversation ? { conversation: cloneDeep(updatedConv) } : {}),
      message: cloneDeep(userMsg),
    });
    onEvent({
      type: 'assistant_start',
      conversationId: convId,
      message: cloneDeep(assistantShell),
    });

    const agentMessages = toAgentMessages(updatedConv.messages);

    return streamSse('/chat/ephemeral/stream', {
      body: {
        conversationId: convId,
        assistantMessageId: assistantId,
        messages: agentMessages,
      },
      onEvent: (evt) => {
        onEvent(evt);
        if (evt.type === 'message_done') {
          const finalMsg = {
            ...assistantShell,
            text: evt.text,
            status: 'done',
          };
          const current = findStoredConversation(convId);
          if (current) {
            replaceStoredConversations(
              getStoredConversations().map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: [...c.messages, finalMsg],
                      updatedAt: finalMsg.createdAt,
                    }
                  : c
              )
            );
          }
        }
      },
      onComplete,
      onError,
    });
  }
}
