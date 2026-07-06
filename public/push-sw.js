/* WaveHome Web Push service worker (scope: /push-sw.js registration). */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || 'WaveHome';
  const options = {
    body: payload.body || '',
    icon: '/favicon-32.png',
    badge: '/favicon-16.png',
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        const client = windowClients[0];
        client.postMessage({ type: 'wavehome:navigate', url });
        return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
      return undefined;
    }),
  );
});
