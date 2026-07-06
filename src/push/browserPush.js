import pushApi from '../api/pushApi';

export function isBrowserPushSupported() {
  return (
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function serializeSubscription(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    keys: json.keys,
    expirationTime: json.expirationTime ?? null,
  };
}

export async function registerPushServiceWorker() {
  return navigator.serviceWorker.register('/push-sw.js');
}

export async function subscribeBrowserPush() {
  if (!isBrowserPushSupported()) {
    throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('알림 권한이 거부되었습니다.');
  }

  const registration = await registerPushServiceWorker();
  const { publicKey } = await pushApi.getVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await pushApi.saveSubscription(serializeSubscription(subscription));
  return subscription;
}

export async function unsubscribeBrowserPush() {
  if (!isBrowserPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();
  }

  await pushApi.deleteSubscription();
}

export async function syncBrowserPush(enabled) {
  if (!isBrowserPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const existing = registration ? await registration.pushManager.getSubscription() : null;

  if (enabled && !existing) {
    await subscribeBrowserPush();
  } else if (!enabled && existing) {
    await unsubscribeBrowserPush();
  }
}

export function listenPushNavigation(onNavigate) {
  if (!navigator.serviceWorker) return () => undefined;

  const handler = (event) => {
    if (event.data?.type !== 'wavehome:navigate') return;
    onNavigate(event.data.url || '/');
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

export function resolvePushUrlToPage(url) {
  const path = (url || '').replace(/^https?:\/\/[^/]+/, '') || '/';
  if (path.includes('chat')) return 'chat';
  if (path.includes('sleep')) return 'sleep';
  if (path.includes('power')) return 'power';
  if (path.includes('home') || path.includes('iot')) return 'home';
  if (path.includes('setting')) return 'setting';
  if (path.includes('weekly') || path.includes('plan')) return 'weeklyPlan';
  return 'main';
}
