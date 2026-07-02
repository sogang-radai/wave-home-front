import { httpClient } from './httpClient';

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

  async getSuggestions() {
    return httpClient.get('/chat/suggestions');
  }

  async askInsight(text) {
    return httpClient.post('/chat/insight-queries', { text });
  }
}
