import { httpClient, streamSse } from './httpClient';

export class ChatApi {
  async getConversations() {
    return httpClient.get('/chat/conversations');
  }

  async getConversation(conversationId) {
    return httpClient.get(`/chat/conversations/${conversationId}`);
  }

  async createConversation(input = {}) {
    const payload = typeof input === 'string' ? { title: input } : input;
    return httpClient.post('/chat/conversations', payload);
  }

  async startConversation(text) {
    return httpClient.post('/chat/conversations', { initialMessage: text });
  }

  async renameConversation(conversationId, title) {
    return httpClient.patch(`/chat/conversations/${conversationId}`, { title });
  }

  async deleteConversation(conversationId) {
    return httpClient.delete(`/chat/conversations/${conversationId}`);
  }

  async sendMessage(conversationId, text) {
    return httpClient.post(`/chat/conversations/${conversationId}/messages`, { text });
  }

  /**
   * SSE 스트리밍 메시지 전송. 이벤트 타입은 docs/api/chat.md 참고.
   * conversationId가 null이면 새 대화를 생성한다.
   * @returns {() => void} abort
   */
  sendMessageStreaming(conversationId, text, { onEvent, onComplete, onError } = {}) {
    const path = conversationId
      ? `/chat/conversations/${conversationId}/messages/stream`
      : '/chat/conversations/stream';
    return streamSse(path, {
      body: { text },
      onEvent,
      onComplete,
      onError,
    });
  }

  async getSuggestions() {
    return httpClient.get('/chat/suggestions');
  }

  async askInsight(text) {
    return httpClient.post('/chat/insight-queries', { text });
  }
}
