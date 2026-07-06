import { delay } from './utils';

// WaveHome VAPID public key (dev; matches bin/config.json push.vapid_public_key).
const MOCK_VAPID_PUBLIC_KEY = 'BKY-kLDZ2RQNzaj6ZAQX48A7Phdw_3VMWTGzly9y7pqDcOA9_YfqxSwtqDdnzq0PBJkjCEue4C0zxe1VBCUdpWY';
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
