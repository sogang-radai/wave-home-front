import { useEffect, useState } from 'react';
import settingsApi from '../../api/settingsApi';
import {
  isBrowserPushSupported,
  pushUnavailableReason,
  subscribeBrowserPush,
  unsubscribeBrowserPush,
} from '../../push/browserPush';
import { SettingsPanel, SettingsSection, SettingsRow } from './SettingsUI';

export function NotificationSettings({ embedded = false }) {
  const [config, setConfig] = useState(null);
  const [pushError, setPushError] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const pushSupported = isBrowserPushSupported();
  const pushBlockedReason = pushUnavailableReason();

  useEffect(() => {
    settingsApi.getGeneralSettings().then(setConfig);
  }, []);

  const patchConfig = async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const saved = await settingsApi.updateGeneralSettings(next);
    if (saved) setConfig(saved);
  };

  const handlePushReceiveToggle = async () => {
    if (!config || pushBusy) return;

    const enabling = !config.browserPushEnabled;
    setPushError(null);
    setPushBusy(true);

    try {
      if (enabling) {
        if (!isBrowserPushSupported()) {
          setPushError(pushBlockedReason || '푸시 알림을 사용할 수 없습니다.');
          return;
        }

        // 브라우저 권한 팝업은 사용자 클릭 직후, 다른 await 전에 요청해야 합니다.
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPushError(
            permission === 'denied'
              ? '알림 권한이 거부되었습니다. 브라우저 주소창 옆 자물쇠/사이트 설정에서 허용할 수 있습니다.'
              : '알림 권한이 필요합니다.',
          );
          return;
        }

        await subscribeBrowserPush({ skipPermissionRequest: true });
        await patchConfig({ browserPushEnabled: true });
      } else {
        await unsubscribeBrowserPush();
        await patchConfig({ browserPushEnabled: false });
      }
    } catch (err) {
      setPushError(err.message || '푸시 알림 설정에 실패했습니다.');
    } finally {
      setPushBusy(false);
    }
  };

  const sectionTitle = embedded ? '알림' : '푸시 알림';
  const body = !config ? (
    <SettingsSection title={sectionTitle}>
      <p className="settings-panel-desc">불러오는 중…</p>
    </SettingsSection>
  ) : (
    <SettingsSection title={sectionTitle}>
      <SettingsRow
        label="푸시 알림 수신"
        desc={pushSupported
          ? '켜면 브라우저 알림 권한을 요청하고, 백그라운드에서도 건강·가전 이벤트를 받습니다.'
          : (pushBlockedReason || '이 환경에서는 푸시 알림을 사용할 수 없습니다.')}
      >
        <button
          type="button"
          className={`toggle-switch toggle-switch--sm ${config.browserPushEnabled ? 'on' : ''}`}
          disabled={!pushSupported || pushBusy}
          aria-pressed={config.browserPushEnabled}
          aria-busy={pushBusy}
          aria-label="푸시 알림 수신"
          onClick={handlePushReceiveToggle}
        >
          <i />
        </button>
      </SettingsRow>
      {pushError && (
        <p className="settings-inline-error" role="alert">{pushError}</p>
      )}
    </SettingsSection>
  );

  if (embedded) return body;

  return (
    <SettingsPanel heading="알림" description="브라우저 푸시 알림 수신 여부를 설정합니다.">
      {body}
    </SettingsPanel>
  );
}
