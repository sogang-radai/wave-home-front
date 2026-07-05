import { httpClient } from './httpClient';

export class PushApi {
  async getPublicKey() {
    return httpClient.get('/push/public-key');
  }

  async subscribe(token) {
    return httpClient.post('/push/subscribe', { token });
  }

  async unsubscribe(token) {
    return httpClient.post('/push/unsubscribe', { token });
  }

  async sendTest(message, { icon, image } = {}) {
    return httpClient.post('/push/test', { message, icon, image });
  }
}
