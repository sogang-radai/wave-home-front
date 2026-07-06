import { delay } from './utils';

// RFC 8292 test key (web-push docs); mock only — production uses server-generated VAPID keys.
const MOCK_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const STORAGE_KEY = 'wavehome_push_subscription';

export class PushApi {
  async getVapidPublicKey() {
    await delay();
    return { publicKey: MOCK_VAPID_PUBLIC_KEY };
  }

  async saveSubscription(subscription) {
    await delay();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    } catch {
      // ignore storage errors
    }
    return { ok: true };
  }

  async deleteSubscription() {
    await delay();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    return { ok: true };
  }
}
