import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initForegroundMessaging, registerServiceWorker } from './push/push';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 푸시 구독을 위해서는 Service Worker가 미리 활성화되어 있어야 한다.
// 구독 자체는 사용자가 설정 화면에서 알림을 켤 때(push.js#subscribePush) 이루어진다.
registerServiceWorker().catch(() => {});

// 새로고침으로 날아간 포그라운드(탭 열려있을 때) 알림 리스너를 기존 구독이 있으면 다시 붙인다.
initForegroundMessaging().catch(() => {});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
