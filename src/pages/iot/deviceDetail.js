import { useEffect, useRef, useState } from 'react';
import iotApi from '../../api/iotApi';
import settingsApi from '../../api/settingsApi';
import { deviceThumbnails, isDeviceOffline } from './iotUtils';
import { EventTimeline } from './EventLogTab';
import { PlugPanel } from './panels/PlugPanel';
import { LightPanel } from './panels/LightPanel';
import { TvPanel } from './panels/TvPanel';
import { CameraPanel } from './panels/CameraPanel';
import { RadarPanel } from './panels/RadarPanel';
import { WaveStationPanel } from './panels/WaveStationPanel';

// Shared between the plain IoT 제어 grid (IotControlTab) and the merged
// 디지털 트윈 홈 sidebar (TwinPage) — same panel set, same tab rules.
export const PANEL_COMPONENTS = {
  plug: PlugPanel,
  light: LightPanel,
  tv: TvPanel,
  camera: CameraPanel,
  radar: RadarPanel,
  wave_station: WaveStationPanel,
};

export function detailTabsFor(device) {
  if (!device) return [];

  if (device.panel === 'radar') {
    const tabs = [];
    if (device.sleepAnalysis)
      tabs.push(['sleep', '수면 관리']);
    tabs.push(['control', '제스처']);
    tabs.push(['log', '로그']);
    return tabs;
  }

  if (device.class === 'wave_station' || device.panel === 'wave_station') {
    return [
      ['control', '제어'],
      ['settings', '설정'],
      ['log', '로그'],
    ];
  }

  return [
    ['control', '제어'],
    ['log', '로그'],
  ];
}

export function defaultDetailTabFor(device) {
  if (!device) return 'control';
  if (isDeviceOffline(device)) return 'log';
  if (device.panel === 'radar')
    return device.sleepAnalysis ? 'sleep' : 'control';
  return 'control';
}

export function DeviceThumb({ deviceClass }) {
  const src = deviceThumbnails[deviceClass];
  if (src) return <img className="iot-device-thumb-img" src={src} alt="" />;
  return <div className="iot-device-thumb-placeholder" aria-hidden="true">⌁</div>;
}

async function findSettingsDevice(deviceId) {
  const { input_devices = [], output_devices = [] } = await settingsApi.getDevices();
  return [...input_devices, ...output_devices].find((item) => item.id === deviceId) || null;
}

export function WaveStationSettingsPanel({ device, onChanged, showToast }) {
  const companion = !!device?.companion;
  const [saving, setSaving] = useState(false);
  const [micGain, setMicGain] = useState(
    () => (typeof device?.micGain === 'number' ? device.micGain : 1),
  );
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [listenState, setListenState] = useState({ enabled: companion, listening: false });
  const gainSaveTimer = useRef(null);

  useEffect(() => {
    if (typeof device?.micGain === 'number')
      setMicGain(device.micGain);
  }, [device?.micGain, device?.id]);

  useEffect(() => {
    if (!device?.id) return undefined;

    const abort = iotApi.subscribeWaveStationTelemetry(device.id, {
      onEvent: (payload) => {
        const c = payload?.companion;
        if (c && typeof c === 'object') {
          setListenState({
            enabled: !!c.enabled,
            listening: !!c.listening,
            processing: !!c.processing,
          });
          if (typeof c.partialText === 'string')
            setPartialText(c.partialText);
          if (typeof c.finalText === 'string')
            setFinalText(c.finalText);
        }
        if (typeof payload?.micGain === 'number')
          setMicGain(payload.micGain);
      },
      onError: () => {},
      onComplete: () => {},
    });

    return () => {
      abort?.();
    };
  }, [device?.id]);

  const patchSettings = async (patch, { toastOnSuccess } = {}) => {
    const current = await findSettingsDevice(device.id);
    const settings = { ...(current?.settings || {}), ...patch };
    const updated = await settingsApi.updateDevice(device.id, { settings });
    if (updated == null) return false;
    await onChanged?.();
    if (toastOnSuccess)
      showToast?.(toastOnSuccess);
    return true;
  };

  const toggleCompanion = async () => {
    if (saving) return;
    const next = !companion;
    setSaving(true);
    try {
      await patchSettings(
        { companion: next },
        { toastOnSuccess: next ? '동반자 모드를 켰습니다.' : '동반자 모드를 껐습니다.' },
      );
    } catch (err) {
      showToast?.(err?.message || '설정을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onGainInput = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    setMicGain(value);
    if (gainSaveTimer.current)
      clearTimeout(gainSaveTimer.current);
    gainSaveTimer.current = setTimeout(async () => {
      try {
        await patchSettings({ mic_gain: value });
      } catch (err) {
        showToast?.(err?.message || '마이크 게인을 저장하지 못했습니다.');
      }
    }, 250);
  };

  useEffect(() => () => {
    if (gainSaveTimer.current)
      clearTimeout(gainSaveTimer.current);
  }, []);

  const displayText = partialText || finalText || '';
  const statusLabel = listenState.processing
    ? '응답 중…'
    : listenState.listening
      ? '듣는 중'
      : companion
        ? '대기 중'
        : '꺼짐';

  return (
    <div className="wave-station-settings-panel">
      <div className="panel-section">
        <span className="device-panel-label">동반자 모드</span>
        <div className="device-companion-row">
          <p>마이크로 말하면 에이전트가 응답합니다.</p>
          <button
            type="button"
            className={`toggle-switch ${companion ? 'on' : ''}`}
            onClick={toggleCompanion}
            disabled={saving}
            aria-label="동반자 모드 토글"
          >
            <i />
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="device-mic-gain-head">
          <span className="device-panel-label">마이크 게인</span>
          <span>{micGain.toFixed(1)}×</span>
        </div>
        <p className="device-panel-hint">마이크 입력 증폭 (동반자 STT·볼륨 미터에 공통 적용).</p>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={micGain}
          onChange={onGainInput}
          aria-label="마이크 게인"
        />
      </div>

      <div className="panel-section device-stt-transcript">
        <div className="device-stt-transcript-head">
          <span className="device-panel-label">인식된 텍스트</span>
          <em>{statusLabel}</em>
        </div>
        <textarea
          className="device-stt-transcript-box"
          readOnly
          value={displayText}
          placeholder={companion ? '말하면 여기에 인식 결과가 표시됩니다.' : '동반자 모드를 켜면 인식 결과를 볼 수 있습니다.'}
          rows={4}
        />
        {finalText && partialText && partialText !== finalText && (
          <small>마지막 확정: {finalText}</small>
        )}
      </div>
    </div>
  );
}

export function RadarSleepAnalysisPanel({ device, onChanged, showToast }) {
  const [accounts, setAccounts] = useState([]);
  const [sleepUserId, setSleepUserId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      settingsApi.getAccounts(),
      findSettingsDevice(device.id),
    ]).then(([accountList, settingsDevice]) => {
      if (cancelled) return;
      setAccounts(accountList || []);
      const saved = settingsDevice?.settings?.sleep_user_id
        ?? settingsDevice?.settings?.sleepUserId
        ?? '';
      setSleepUserId(saved === null || saved === undefined ? '' : String(saved));
    }).catch(() => {
      if (!cancelled) {
        setAccounts([]);
        setSleepUserId('');
      }
    });
    return () => { cancelled = true; };
  }, [device.id]);

  const onSelectUser = async (event) => {
    const next = event.target.value;
    const prev = sleepUserId;
    setSleepUserId(next);
    if (saving) return;
    setSaving(true);
    try {
      const current = await findSettingsDevice(device.id);
      const settings = {
        ...(current?.settings || {}),
        sleep_user_id: next ? Number(next) || next : null,
      };
      const updated = await settingsApi.updateDevice(device.id, { settings });
      if (updated == null) {
        setSleepUserId(prev);
        return;
      }
      await onChanged?.();
      showToast?.(next ? '수면 관리 대상을 저장했습니다.' : '수면 관리 대상을 해제했습니다.');
    } catch (err) {
      setSleepUserId(prev);
      showToast?.(err?.message || '수면 관리 대상을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="radar-sleep-analysis-panel">
      <div className="panel-section">
        <span className="device-panel-label">이 레이더로 누구의 수면을 관리할까요?</span>
        <select
          className="settings-select"
          value={sleepUserId}
          onChange={onSelectUser}
          disabled={saving || accounts.length === 0}
        >
          <option value="">선택 안 함</option>
          {accounts.map((account) => (
            <option key={account.id} value={String(account.id)}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
      <p className="device-panel-hint">분석 결과는 수면 관리 페이지에서 확인할 수 있습니다.</p>
    </div>
  );
}

export function DeviceConnectionLog({ device, events }) {
  const connectionEvents = events.filter((e) => e.type === 'connection');
  const err = device.connectionError;

  return (
    <div className="device-connection-log">
      {err && (
        <div className="device-connection-error">
          <strong>연결 오류</strong>
          <span>코드 {err.code}: {err.message}</span>
        </div>
      )}
      {!err && isDeviceOffline(device) && (
        <div className="device-connection-error">
          <strong>오프라인</strong>
          <span>{device.stateSummary || '기기에 연결할 수 없습니다.'}</span>
        </div>
      )}
      {connectionEvents.length === 0 ? (
        <p className="panel-empty">연결 관련 로그가 없습니다.</p>
      ) : (
        <EventTimeline events={connectionEvents} rules={[]} compact />
      )}
    </div>
  );
}

// Tab-body switch shared by the grid detail card and the sidebar detail view.
export function DeviceDetailBody({ device, detailTab, onChanged, showToast, deviceEvents, allDeviceRules }) {
  const PanelComponent = device ? PANEL_COMPONENTS[device.panel] : null;

  return (
    <div className="iot-detail-content">
      {detailTab === 'control' && (
        device.connectionStatus === 'initializing' ? (
          <p className="panel-empty">기기를 초기화하는 중입니다…</p>
        ) : !device.connected ? (
          <p className="panel-empty">기기가 오프라인 상태입니다. 연결 상태를 확인해주세요.</p>
        ) : PanelComponent ? (
          <PanelComponent device={device} onChanged={onChanged} />
        ) : (
          <p className="panel-empty">이 기기 종류에는 아직 제어 UI가 없습니다.</p>
        )
      )}

      {detailTab === 'sleep' && (
        <RadarSleepAnalysisPanel
          device={device}
          onChanged={onChanged}
          showToast={showToast}
        />
      )}

      {detailTab === 'settings' && (
        <WaveStationSettingsPanel
          device={device}
          onChanged={onChanged}
          showToast={showToast}
        />
      )}

      {detailTab === 'log' && (
        isDeviceOffline(device) ? (
          <DeviceConnectionLog device={device} events={deviceEvents} />
        ) : (
          <EventTimeline events={deviceEvents} rules={allDeviceRules} compact />
        )
      )}
    </div>
  );
}
