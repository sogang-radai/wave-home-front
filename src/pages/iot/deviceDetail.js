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
// 디지털 트윈 홈 sidebar (HomeTwinPage) — same panel set, same tab rules.
export const PANEL_COMPONENTS = {
  plug: PlugPanel,
  light: LightPanel,
  tv: TvPanel,
  camera: CameraPanel,
  radar: RadarPanel,
  wave_station: WaveStationPanel,
};

export function detailTabsFor(device) {
  const controlLabel = device?.panel === 'radar' ? '제스처 셋' : '제어';
  const tabs = [
    ['control', controlLabel],
  ];
  if (device?.panel === 'radar' && device?.sleepAnalysis)
    tabs.push(['sleep', '수면 분석']);
  if (device?.class === 'wave_station' || device?.panel === 'wave_station')
    tabs.push(['settings', '장치 설정']);
  tabs.push(['log', '로그']);
  return tabs;
}

export function DeviceThumb({ deviceClass }) {
  const src = deviceThumbnails[deviceClass];
  if (src) return <img className="iot-device-thumb-img" src={src} alt="" />;
  return <div className="iot-device-thumb-placeholder" aria-hidden="true">⌁</div>;
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
    const { input_devices = [], output_devices = [] } = await settingsApi.getDevices();
    const current = [...input_devices, ...output_devices].find((item) => item.id === device.id);
    const settings = { ...(current?.settings || {}), ...patch };
    await settingsApi.updateDevice(device.id, { settings });
    await onChanged?.();
    if (toastOnSuccess)
      showToast?.(toastOnSuccess);
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
      <div className="device-companion-row">
        <div>
          <strong>동반자 모드</strong>
          <p>Wave Station 마이크로 말하면 에이전트가 응답합니다.</p>
        </div>
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

      <div className="device-mic-gain-row">
        <div className="device-mic-gain-head">
          <strong>마이크 게인</strong>
          <span>{micGain.toFixed(1)}×</span>
        </div>
        <p>Wave Station 마이크 입력 증폭 (동반자 STT·볼륨 미터에 공통 적용).</p>
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

      <div className="device-stt-transcript">
        <div className="device-stt-transcript-head">
          <strong>인식된 텍스트</strong>
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

export function RadarSleepAnalysisPanel() {
  return (
    <div className="radar-sleep-analysis-panel">
      <strong>수면 분석 중</strong>
      <p>이 레이더가 수면 중 움직임과 활동을 분석하고 있어요.</p>
      <span>분석 결과는 수면 관리 페이지에서 확인할 수 있습니다.</span>
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
          <span>{device.stateSummary || '장치에 연결할 수 없습니다.'}</span>
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
          <p className="panel-empty">장치를 초기화하는 중입니다…</p>
        ) : !device.connected ? (
          <p className="panel-empty">장치가 오프라인 상태입니다. 연결 상태를 확인해주세요.</p>
        ) : PanelComponent ? (
          <PanelComponent device={device} onChanged={onChanged} />
        ) : (
          <p className="panel-empty">이 장치 클래스에는 아직 제어 UI가 없습니다.</p>
        )
      )}

      {detailTab === 'sleep' && <RadarSleepAnalysisPanel />}

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
