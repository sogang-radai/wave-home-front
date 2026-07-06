import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { GearIcon, TrashIcon } from '../settings/SettingsUI';
import homeApi from '../../api/homeApi';
import { deviceThumbnails, describeSchedule, describeTrigger, EXEC_MODE_LABELS } from './iotUtils';
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
  return [
    ['control', controlLabel],
    ['schedule', '예약'],
    ['log', '로그'],
  ];
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
  const [roomFilter, setRoomFilter] = useState('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [detailTab, setDetailTab] = useState('control');
  const [deviceRules, setDeviceRules] = useState([]);
  const [allDeviceRules, setAllDeviceRules] = useState([]);
  const [deviceEvents, setDeviceEvents] = useState([]);
  const [editorState, setEditorState] = useState(null); // { rule } | { defaults } | null
  const [reconnectingId, setReconnectingId] = useState(null);
  const [toast, setToast] = useState('');

  const loadDevices = () => homeApi.getDevices().then(setDevices);

  useEffect(() => {
    homeApi.getRooms().then(setRooms);
    loadDevices();
  }, []);

  const filteredDevices = useMemo(
    () => (roomFilter === 'all' ? devices : devices.filter((d) => d.room?.id === roomFilter)),
    [devices, roomFilter]
  );

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
    homeApi.getRulesForDevice(deviceId).then((list) => {
      setAllDeviceRules(list);
      setDeviceRules(list.filter((r) => !!r.schedule));
    });
  };

  useEffect(() => {
    if (!selectedDevice) return;
    refreshDeviceRules(selectedDevice.id);
    homeApi.getEvents({ deviceId: selectedDevice.id }).then(setDeviceEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.id, detailTab]);

  const selectDevice = (device) => {
    setSelectedDeviceId(device.id);
    setDetailTab('control');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const reconnect = async (event, device) => {
    event.stopPropagation();
    setReconnectingId(device.id);
    try {
      await homeApi.reconnectDevice(device.id);
      await loadDevices();
      showToast(`${device.name} 재연결 완료`);
    } catch (err) {
      showToast(err.message || '재연결에 실패했습니다.');
    } finally {
      setReconnectingId(null);
    }
  };

  const saveRule = async (payload, ruleId) => {
    if (ruleId) await homeApi.updateRule(ruleId, payload);
    else await homeApi.createRule(payload);
    setEditorState(null);
    refreshDeviceRules(selectedDevice.id);
    showToast('룰을 저장했습니다.');
  };

  const deleteRule = async (rule) => {
    await homeApi.deleteRule(rule.id);
    setEditorState(null);
    refreshDeviceRules(selectedDevice.id);
    showToast('룰을 삭제했습니다.');
  };

  const toggleRule = async (rule) => {
    await homeApi.setRuleEnabled(rule.id, !rule.enabled);
    refreshDeviceRules(selectedDevice.id);
  };

  const executeRule = async (rule) => {
    const result = await homeApi.executeRuleManually(rule.id);
    showToast(result.skipped ? `쿨다운 중입니다 (${Math.ceil(result.remainingMs / 100) / 10}초 남음)` : '룰을 실행했습니다.');
    loadDevices();
    homeApi.getEvents({ deviceId: selectedDevice.id }).then(setDeviceEvents);
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

      <div className="iot-device-grid">
        {filteredDevices.map((device) => (
          <button
            key={device.id}
            type="button"
            className={`iot-device-card${selectedDeviceId === device.id ? ' selected' : ''}${!device.connected ? ' offline' : ''}`}
            onClick={() => selectDevice(device)}
          >
            <span
              className={`device-dot ${device.connected ? 'online' : 'offline'}`}
              title={device.connected ? '온라인' : '오프라인'}
              aria-label={device.connected ? '온라인' : '오프라인'}
            />
            <DeviceThumb deviceClass={device.class} />
            <div className="iot-device-card-body">
              <span className="iot-device-card-room">{device.room?.name || '미지정'}</span>
              <strong className="iot-device-card-name" title={device.name}>{device.name}</strong>
            </div>
            {!device.connected && (
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
        ))}
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
              !selectedDevice.connected ? (
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

            {detailTab === 'log' && (
              <EventTimeline events={deviceEvents} rules={allDeviceRules} compact />
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
