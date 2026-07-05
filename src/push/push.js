import { getApps, initializeApp } from 'firebase/app';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import pushApi from '../api/pushApi';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';

const SW_PATH = '/firebase-messaging-sw.js';
const STORAGE_KEY = 'wavehome:fcmToken';
export const PUSH_RECEIVED_EVENT = 'wavehome:push-received';

function getFirebaseApp() {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

function serviceWorkerUrl() {
  // public/firebase-messaging-sw.js는 process.env를 못 읽으므로 쿼리스트링으로 config를 실어보낸다.
  const params = new URLSearchParams(firebaseConfig);
  return `${SW_PATH}?${params.toString()}`;
}

export async function isPushSupported() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !isFirebaseConfigured) {
    return false;
  }
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

// 백그라운드(firebase-messaging-sw.js)/포그라운드(onMessage) 두 경로 모두에서 호출된다.
// 알림 패널(종 아이콘)이 새로고침 없이 갱신되도록 App.js가 이 이벤트를 구독한다.
function dispatchPushReceived(payload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PUSH_RECEIVED_EVENT, { detail: payload }));
}

// SW가 postMessage로 보낸 백그라운드 수신 알림을 페이지로 중계한다.
function bridgeServiceWorkerMessages() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'wavehome-push') {
      dispatchPushReceived(event.data.payload);
    }
  });
}

let messageBridgeReady = false;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !isFirebaseConfigured) return null;
  if (!messageBridgeReady) {
    messageBridgeReady = true;
    bridgeServiceWorkerMessages();
  }
  return navigator.serviceWorker.register(serviceWorkerUrl());
}

function getStoredToken() {
  return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
}

// 포그라운드(탭이 열려있는 상태)에서는 FCM이 알림을 자동으로 띄워주지 않고 이 리스너로 넘긴다.
// new Notification()은 Service Worker가 페이지를 컨트롤 중일 때 일부 브라우저에서 막히므로
// registration.showNotification()을 그대로 재사용한다(백그라운드 경로와 동일한 방식).
// 페이지를 새로고침하면 리스너가 사라지므로, subscribePush() 시점뿐 아니라 앱이 로드될 때마다
// (기존 토큰이 있으면) 다시 붙여줘야 한다 — initForegroundMessaging() 참고.
let foregroundListenerAttached = false;

function listenForegroundMessages(messaging, registration) {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;
  onMessage(messaging, (payload) => {
    const notification = payload.notification || {};
    const url = payload.data?.url || '/';

    if (registration) {
      registration.showNotification(notification.title || 'WaveHome', {
        body: notification.body || '',
        icon: notification.icon || '/logo192.png',
        image: notification.image,
        badge: '/favicon-32.png',
        data: { url },
      });
    }

    dispatchPushReceived(payload);
  });
}

// 앱 로드 시 호출: 이미 구독돼 있는 브라우저라면(토큰이 저장돼 있으면) 포그라운드 리스너를 다시 붙인다.
export async function initForegroundMessaging() {
  if (!isFirebaseConfigured || !getStoredToken()) return;
  if (!(await isPushSupported())) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  listenForegroundMessages(getMessaging(getFirebaseApp()), registration);
}

export async function subscribePush() {
  if (!(await isPushSupported())) {
    throw new Error('이 브라우저는 푸시 알림을 지원하지 않거나 Firebase 설정이 없습니다.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았습니다.');
  }

  const registration = await registerServiceWorker();
  const { publicKey } = await pushApi.getPublicKey();
  if (!publicKey) {
    throw new Error('서버에서 FCM 공개키(VAPID)를 가져오지 못했습니다.');
  }

  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, { vapidKey: publicKey, serviceWorkerRegistration: registration });
  if (!token) {
    throw new Error('푸시 토큰을 발급받지 못했습니다.');
  }

  await pushApi.subscribe(token);
  window.localStorage.setItem(STORAGE_KEY, token);
  listenForegroundMessages(messaging, registration);

  return token;
}

export async function unsubscribePush() {
  const token = getStoredToken();
  if (isFirebaseConfigured) {
    const messaging = getMessaging(getFirebaseApp());
    await deleteToken(messaging).catch(() => {});
  }
  if (token) {
    await pushApi.unsubscribe(token);
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function getExistingPushSubscription() {
  if (!(await isPushSupported())) return null;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  return getStoredToken();
}
