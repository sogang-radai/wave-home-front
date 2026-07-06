import { httpClient } from './httpClient';

export class PushApi {
  getVapidPublicKey() {
    return httpClient.get('/push/vapid-public-key');
  }

  saveSubscription(subscription) {
    return httpClient.put('/push/subscription', subscription);
  }

  deleteSubscription() {
    return httpClient.delete('/push/subscription');
  }
}
