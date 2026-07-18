import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { GearIcon, TrashIcon } from '../settings/SettingsUI';
import iotApi from '../../api/iotApi';
import settingsApi from '../../api/settingsApi';
import { deviceThumbnails, describeSchedule, describeTrigger, deviceDotClass, deviceDotTitle, EXEC_MODE_LABELS, isDeviceOffline, sortDevicesForControl } from './iotUtils';
import { ReconnectIcon } from './icons';
import { RuleEditor } from './RuleEditor';
import { EventTimeline } from './EventLogTab';
import { PlugPanel } from './panels/PlugPanel';
import { LightPanel } from './panels/LightPanel';
import { TvPanel } from './panels/TvPanel';
import { CameraPanel } from './panels/CameraPanel';
import { RadarPanel } from './panels/RadarPanel';
import { WaveStationPanel } from './panels/WaveStationPanel';

const PANEL_COMPONENTS = {
  plug: PlugPanel,
  light: LightPanel,
  tv: TvPanel,
  camera: CameraPanel,
  radar: RadarPanel,
  wave_station: WaveStationPanel,
};

function detailTabsFor(device) {
  const controlLabel = device?.panel === 'radar' ? '제스처 셋' : '제어';
  const tabs = [
    ['control', controlLabel],
  ];
  if (device?.panel === 'radar' && device?.sleepAnalysis)
    tabs.push(['sleep', '수면 분석']);
  if (device?.class === 'wave_station' || device?.panel === 'wave_station')
    tabs.push(['settings', '장치 설정']);
  tabs.push(['schedule', '예약'], ['log', '로그']);
  return tabs;
}

function WaveStationSettingsPanel({ device, onChanged, showToast }) {
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

function RadarSleepAnalysisPanel() {
  return (
    <div className="radar-sleep-analysis-panel">
      <strong>수면 분석 중</strong>
      <p>이 레이더가 수면 중 움직임과 활동을 분석하고 있어요.</p>
      <span>분석 결과는 수면 관리 페이지에서 확인할 수 있습니다.</span>
    </div>
  );
}

function DeviceConnectionLog({ device, events }) {
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

function DeviceThumb({ deviceClass }) {
  const src = deviceThumbnails[deviceClass];
  if (src) return <img className="iot-device-thumb-img" src={src} alt="" />;
  return <div className="iot-device-thumb-placeholder" aria-hidden="true">⌁</div>;
}

function RuleRow({ rule, devices, onToggle, onEdit, onDelete, onExecute }) {
  const triggerDevice = devices.find((d) => d.id === rule.trigger?.deviceId);
  return (
    <article className="rule-row">
      <div className="rule-row-main">
        <button type="button" className={`toggle-switch toggle-switch--sm${rule.enabled ? ' on' : ''}`} onClick={() => onToggle(rule)} aria-label="룰 활성화">
          <i />
        </button>
        <div className="rule-row-body">
          <strong>{rule.name}</strong>
          <span>
            {rule.trigger && `트리거: ${describeTrigger(rule.trigger, { deviceName: triggerDevice?.name })}`}
            {rule.schedule && `예약: ${describeSchedule(rule.schedule)}`}
            {' → '}{rule.actionDeviceName} · {rule.action.name} ({EXEC_MODE_LABELS[rule.execMode]})
          </span>
        </div>
      </div>
      <div className="rule-row-actions">
        <button type="button" className="settings-btn-ghost" onClick={() => onExecute(rule)}>테스트</button>
        <button type="button" className="icon-btn" onClick={() => onEdit(rule)} aria-label="수정" title="수정">
          <GearIcon width={16} height={16} />
        </button>
        <button type="button" className="icon-btn icon-btn-delete" onClick={() => onDelete(rule)} aria-label="삭제" title="삭제">
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    </article>
  );
}

export function IotControlTab() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [detailTab, setDetailTab] = useState('control');
  const [deviceRules, setDeviceRules] = useState([]);
  const [allDeviceRules, setAllDeviceRules] = useState([]);
  const [deviceEvents, setDeviceEvents] = useState([]);
  const [editorState, setEditorState] = useState(null); // { rule } | { defaults } | null
  const [reconnectingId, setReconnectingId] = useState(null);
  const [toast, setToast] = useState('');

  const devicesPollRef = useRef(null);
  const devicesAbortRef = useRef(null);

  const loadDevices = () => {
    if (devicesPollRef.current)
      return devicesPollRef.current;

    if (devicesAbortRef.current)
      devicesAbortRef.current.abort();

    const controller = new AbortController();
    devicesAbortRef.current = controller;

    devicesPollRef.current = iotApi.getDevices({ signal: controller.signal })
      .then((list) => {
        setDevices(list);
        setDevicesError('');
      })
      .catch((err) => {
        if (err?.name === 'AbortError')
          return;
        setDevicesError(err?.message || '장치 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        devicesPollRef.current = null;
        if (devicesAbortRef.current === controller)
          devicesAbortRef.current = null;
        setDevicesLoading(false);
      });

    return devicesPollRef.current;
  };

  useEffect(() => {
    iotApi.getRooms().then(setRooms);
    loadDevices();
    const timer = setInterval(loadDevices, 3000);
    const loadingCap = setTimeout(() => setDevicesLoading(false), 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(loadingCap);
      if (devicesAbortRef.current)
        devicesAbortRef.current.abort();
    };
  }, []);

  const filteredDevices = useMemo(() => {
    const list = roomFilter === 'all'
      ? devices
      : devices.filter((d) => String(d.room?.id ?? '') === String(roomFilter));
    return sortDevicesForControl(list);
  }, [devices, roomFilter]);

  // Always keep exactly one device selected — the grid never shows an
  // unselected state. Falls back to the first device in the filtered list
  // whenever the current selection is missing or filtered out.
  useEffect(() => {
    if (filteredDevices.length === 0) {
      if (selectedDeviceId !== null) setSelectedDeviceId(null);
      return;
    }
    if (!filteredDevices.some((d) => d.id === selectedDeviceId)) {
      setSelectedDeviceId(filteredDevices[0].id);
      setDetailTab('control');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDevices]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  const refreshDeviceRules = (deviceId) => {
    if (!deviceId) return;
    iotApi.getRulesForDevice(deviceId).then((list) => {
      setAllDeviceRules(list);
      setDeviceRules(list.filter((r) => !!r.schedule));
    });
  };

  useEffect(() => {
    if (!selectedDevice) return;
    refreshDeviceRules(selectedDevice.id);
    iotApi.getEvents({ deviceId: selectedDevice.id }).then(setDeviceEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.id, detailTab]);

  // One-shot schedules disable themselves after fire; poll so the toggle flips without a remount.
  useEffect(() => {
    if (!selectedDevice || detailTab !== 'schedule') return undefined;
    const timer = setInterval(() => refreshDeviceRules(selectedDevice.id), 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.id, detailTab]);

  const selectDevice = (device) => {
    setSelectedDeviceId(device.id);
    if (isDeviceOffline(device)) {
      setDetailTab('log');
      iotApi.getEvents({ deviceId: device.id }).then(setDeviceEvents);
    } else {
      setDetailTab('control');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const reconnect = async (event, device) => {
    event.stopPropagation();
    setReconnectingId(device.id);
    try {
      await iotApi.reconnectDevice(device.id);
      await loadDevices();
      iotApi.getEvents({ deviceId: device.id }).then(setDeviceEvents);
      showToast(`${device.name} 재연결 시도 완료`);
    } catch (err) {
      showToast(err.message || '재연결에 실패했습니다.');
    } finally {
      setReconnectingId(null);
    }
  };

  const saveRule = async (payload, ruleId) => {
    if (ruleId) await iotApi.updateRule(ruleId, payload);
    else await iotApi.createRule(payload);
    setEditorState(null);
    refreshDeviceRules(selectedDevice.id);
    showToast('룰을 저장했습니다.');
  };

  const deleteRule = async (rule) => {
    await iotApi.deleteRule(rule.id);
    setEditorState(null);
    refreshDeviceRules(selectedDevice.id);
    showToast('룰을 삭제했습니다.');
  };

  const toggleRule = async (rule) => {
    await iotApi.setRuleEnabled(rule.id, !rule.enabled);
    refreshDeviceRules(selectedDevice.id);
  };

  const executeRule = async (rule) => {
    const result = await iotApi.executeRuleManually(rule.id);
    showToast(result.skipped ? `쿨다운 중입니다 (${Math.ceil(result.remainingMs / 100) / 10}초 남음)` : '룰을 실행했습니다.');
    loadDevices();
    iotApi.getEvents({ deviceId: selectedDevice.id }).then(setDeviceEvents);
  };

  const PanelComponent = selectedDevice ? PANEL_COMPONENTS[selectedDevice.panel] : null;
  const detailTabs = detailTabsFor(selectedDevice);

  return (
    <div className="iot-control-layout">
      <div className="room-filter-pills">
        <button type="button" className={roomFilter === 'all' ? 'active' : ''} onClick={() => setRoomFilter('all')}>전체</button>
        {rooms.map((room) => (
          <button key={room.id} type="button" className={roomFilter === room.id ? 'active' : ''} onClick={() => setRoomFilter(room.id)}>
            {room.name}
          </button>
        ))}
      </div>

      {devicesLoading && devices.length === 0 && (
        <p className="panel-loading">장치 목록을 불러오는 중…</p>
      )}
      {devicesError && devices.length === 0 && (
        <p className="panel-empty">{devicesError}</p>
      )}

      <div className="iot-device-grid">
        {filteredDevices.map((device) => {
          const dotClass = deviceDotClass(device);
          const showReconnect = isDeviceOffline(device);
          return (
          <button
            key={device.id}
            type="button"
            className={`iot-device-card${selectedDeviceId === device.id ? ' selected' : ''}${!device.connected ? ' offline' : ''}`}
            onClick={() => selectDevice(device)}
          >
            <span
              className={`device-dot ${dotClass}`}
              title={deviceDotTitle(device)}
              aria-label={deviceDotTitle(device)}
            />
            <DeviceThumb deviceClass={device.class} />
            <div className="iot-device-card-body">
              <span className="iot-device-card-room">{device.room?.name || '미지정'}</span>
              <strong className="iot-device-card-name" title={device.name}>{device.name}</strong>
            </div>
            {showReconnect && (
              <span
                role="button"
                tabIndex={0}
                className={`iot-device-reconnect-btn${reconnectingId === device.id ? ' spinning' : ''}`}
                onClick={(event) => reconnect(event, device)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') reconnect(event, device);
                }}
                aria-label="재연결"
                title="재연결 시도"
              >
                <ReconnectIcon width={16} height={16} />
              </span>
            )}
          </button>
          );
        })}
        {filteredDevices.length === 0 && <p className="panel-empty">이 구역에 등록된 장치가 없습니다.</p>}
      </div>

      {selectedDevice && (
        <Card title={`${selectedDevice.name} · ${selectedDevice.classLabel}`} wide>
          <div className="device-detail-tabs">
            {detailTabs.map(([id, label]) => (
              <button key={id} type="button" className={detailTab === id ? 'active' : ''} onClick={() => setDetailTab(id)}>{label}</button>
            ))}
          </div>

          <div className="iot-detail-content">
            {detailTab === 'control' && (
              selectedDevice.connectionStatus === 'initializing' ? (
                <p className="panel-empty">장치를 초기화하는 중입니다…</p>
              ) : !selectedDevice.connected ? (
                <p className="panel-empty">장치가 오프라인 상태입니다. 연결 상태를 확인해주세요.</p>
              ) : PanelComponent ? (
                <PanelComponent device={selectedDevice} onChanged={loadDevices} />
              ) : (
                <p className="panel-empty">이 장치 클래스에는 아직 제어 UI가 없습니다.</p>
              )
            )}

            {detailTab === 'schedule' && (
              <div className="rule-list">
                <div className="rule-list-head">
                  <span>{deviceRules.length}개 예약</span>
                  <button type="button" className="settings-btn-primary" onClick={() => setEditorState({ defaults: { schedule: { repeat: 'once', delayMinutes: 30 }, action: { deviceId: selectedDevice.id, name: '', params: {} } } })}>+ 예약 추가</button>
                </div>
                {deviceRules.length === 0 && <p className="panel-empty">등록된 예약이 없습니다.</p>}
                {deviceRules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} devices={devices} onToggle={toggleRule} onEdit={(r) => setEditorState({ rule: r })} onDelete={deleteRule} onExecute={executeRule} />
                ))}
              </div>
            )}

            {detailTab === 'sleep' && <RadarSleepAnalysisPanel />}

            {detailTab === 'settings' && (
              <WaveStationSettingsPanel
                device={selectedDevice}
                onChanged={loadDevices}
                showToast={showToast}
              />
            )}

            {detailTab === 'log' && (
              isDeviceOffline(selectedDevice) ? (
                <DeviceConnectionLog device={selectedDevice} events={deviceEvents} />
              ) : (
                <EventTimeline events={deviceEvents} rules={allDeviceRules} compact />
              )
            )}
          </div>
        </Card>
      )}

      {editorState && (
        <RuleEditor
          open
          initialRule={editorState.rule}
          defaults={editorState.defaults}
          devices={devices}
          onSave={saveRule}
          onCancel={() => setEditorState(null)}
          onDelete={(ruleId) => deleteRule({ id: ruleId })}
        />
      )}

      {toast && <div className="iot-toast">{toast}</div>}
    </div>
  );
}
