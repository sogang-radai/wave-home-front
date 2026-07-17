import { httpClient, streamSseGet } from './httpClient';

export class SttApi {
  async createSession(locale = 'ko-KR') {
    return httpClient.post('/chat/stt/sessions', { locale });
  }

  /**
   * SSE partial events for an STT session.
   * @returns {() => void} abort
   */
  streamEvents(sessionId, { onEvent, onComplete, onError } = {}) {
    return streamSseGet(`/chat/stt/sessions/${sessionId}/events`, {
      onEvent,
      onComplete,
      onError,
    });
  }

  async pushAudio(sessionId, pcmFloat32) {
    const buffer = pcmFloat32.buffer.slice(
      pcmFloat32.byteOffset,
      pcmFloat32.byteOffset + pcmFloat32.byteLength,
    );
    return httpClient.postBinary(`/chat/stt/sessions/${sessionId}/audio`, buffer);
  }

  async endSession(sessionId) {
    return httpClient.post(`/chat/stt/sessions/${sessionId}/end`, {});
  }

  async abortSession(sessionId) {
    return httpClient.delete(`/chat/stt/sessions/${sessionId}`);
  }
}
