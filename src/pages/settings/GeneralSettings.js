import { useEffect, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import settingsApi from '../../api/settingsApi';
import pushApi from '../../api/pushApi';
import { getExistingPushSubscription, isPushSupported, subscribePush, unsubscribePush } from '../../push/push';

export function GeneralSettings() {
  const [config, setConfig] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [ttsSpeakers, setTtsSpeakers] = useState([]);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushTestStatus, setPushTestStatus] = useState('');
  const [pushTestBusy, setPushTestBusy] = useState(false);
  const pushTestTimerRef = useRef(null);

  useEffect(() => {
    settingsApi.getGeneralSettings().then(setConfig);
    settingsApi.getSounds().then(setSounds);
    settingsApi.getTtsSpeakers().then(setTtsSpeakers);
    isPushSupported().then(setPushSupported);
    getExistingPushSubscription().then((subscription) => setPushEnabled(!!subscription));

    return () => {
      if (pushTestTimerRef.current) {
        window.clearTimeout(pushTestTimerRef.current);
      }
    };
  }, []);

  const patchConfig = async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const saved = await settingsApi.updateGeneralSettings(next);
    setConfig(saved);
  };

  const togglePush = async () => {
    setPushError('');
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribePush();
        setPushEnabled(false);
      } else {
        await subscribePush();
        setPushEnabled(true);
      }
    } catch (error) {
      setPushError(error.message || '푸시 알림 설정에 실패했습니다.');
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = () => {
    if (pushTestBusy) return;

    setPushTestBusy(true);
    setPushTestStatus('8초 뒤 전송합니다. 지금 다른 탭이나 앱으로 전환해 백그라운드 알림을 확인하세요.');

    pushTestTimerRef.current = window.setTimeout(async () => {
      setPushTestStatus('백그라운드 테스트 알림을 전송 중입니다...');
      try {
        const result = await pushApi.sendTest('백그라운드 테스트 알림입니다 — 이 메시지가 보이면 웹 푸시가 정상 동작하는 거예요.', {
          icon: '/logo192.png',
          image: '/logo512.png',
        });
        const sentCount = result?.sentCount || 0;
        const subscriptionCount = result?.subscriptionCount || 0;
        const deliverySummary = result?.delivery
          ?.map((item) => `${item.status}${item.error ? `: ${item.error}` : ''}`)
          .join(', ');
        setPushTestStatus(
          sentCount > 0
            ? `FCM 전송 성공(${sentCount}/${subscriptionCount}). 그래도 안 뜨면 브라우저/OS 표시 설정 또는 service worker 수신 문제입니다.`
            : `FCM 전송 실패(${sentCount}/${subscriptionCount})${deliverySummary ? ` — ${deliverySummary}` : ''}`
        );
      } catch (error) {
        setPushTestStatus(error.message || '테스트 발송에 실패했습니다.');
      } finally {
        pushTestTimerRef.current = null;
        setPushTestBusy(false);
      }
    }, 8000);
  };

  if (!config) return null;

  return (
    <Card title="일반">
      <div className="general-setting-row">
        <div>
          <strong>테마</strong>
          <span>화면 밝기와 톤을 선택합니다.</span>
        </div>
        <div className="segmented">
          <button type="button" className={config.theme === 'light' ? 'active' : ''} onClick={() => patchConfig({ theme: 'light' })}>라이트</button>
          <button type="button" className={config.theme === 'dark' ? 'active' : ''} onClick={() => patchConfig({ theme: 'dark' })}>다크</button>
        </div>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>언어</strong>
          <span>앱에서 사용할 언어를 선택합니다.</span>
        </div>
        <select value={config.language} onChange={(event) => patchConfig({ language: event.target.value })}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>알림음 설정</strong>
          <span>알림이 울릴 때 재생할 곡을 선택합니다.</span>
        </div>
        <select value={config.notificationSound} onChange={(event) => patchConfig({ notificationSound: event.target.value })}>
          {sounds.map((song) => (
            <option key={song.id} value={song.id}>{song.label}</option>
          ))}
        </select>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>브라우저 푸시 알림</strong>
          <span>
            {pushSupported
              ? '앱을 닫아둔 상태에서도 브라우저 알림으로 받습니다.'
              : '현재 브라우저 또는 서버 설정에서는 지원하지 않는 기능입니다.'}
          </span>
          {pushError && <span style={{ display: 'block', color: 'var(--danger)' }}>{pushError}</span>}
        </div>
        <button
          type="button"
          className={`toggle-switch ${pushEnabled ? 'on' : ''}`}
          onClick={togglePush}
          disabled={pushBusy || !pushSupported}
          aria-label="브라우저 푸시 알림 토글"
        >
          <i />
        </button>
      </div>

      {pushEnabled && (
        <div className="general-setting-row">
          <div>
            <strong>푸시 테스트</strong>
            <span>{pushTestStatus || '버튼을 누른 뒤 다른 탭이나 앱으로 전환해 백그라운드 푸시를 테스트합니다.'}</span>
          </div>
          <button type="button" className="ghost-btn" onClick={sendTestPush} disabled={pushTestBusy}>
            {pushTestBusy ? '전송 예약됨' : '백그라운드 테스트'}
          </button>
        </div>
      )}

      <div className="tts-setting-block">
        <div className="tts-setting-head">
          <div>
            <strong>TTS 목소리</strong>
            <span>Supertonic 3 · ko-KR 화자 프리셋</span>
          </div>
        </div>
        <div className="tts-speaker-grid">
          {ttsSpeakers.map((speaker) => (
            <button
              type="button"
              key={speaker.id}
              className={`tts-speaker-card ${config.ttsSpeakerId === speaker.id ? 'active' : ''}`}
              onClick={() => patchConfig({ ttsSpeakerId: speaker.id })}
            >
              <strong>{speaker.name}({speaker.gender === 'female' ? '여성' : '남성'})</strong>
              <em>{speaker.description}</em>
              <small>{speaker.character}</small>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
