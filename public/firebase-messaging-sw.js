/* eslint-disable no-undef, no-restricted-globals */
// CRA는 public/ 안의 파일을 그대로 정적 서빙만 하고 process.env를 주입하지 않는다.
// 그래서 firebaseConfig는 src/firebaseConfig.js의 값을 등록 시점에 쿼리스트링으로 실어
// 넘겨받는다 (src/push/push.js#registerServiceWorker 참고). 이 값들은 클라이언트 식별용
// 공개 설정일 뿐이라 URL에 노출돼도 안전하다.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const url = (payload.data && payload.data.url) || payload.fcmOptions?.link || '/';

  self.registration.showNotification(notification.title || 'WaveHome', {
    body: notification.body || '',
    icon: notification.icon || '/logo192.png',
    image: notification.image,
    badge: '/favicon-32.png',
    data: { url },
  });

  // 열려있는 탭이 있으면 알림 패널(종 아이콘)도 새로고침 없이 갱신되도록 알려준다.
  // (src/push/push.js의 navigator.serviceWorker의 'message' 리스너가 받는다)
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => client.postMessage({ type: 'wavehome-push', payload }));
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data?.url || '/');
      }
      return undefined;
    })
  );
});
