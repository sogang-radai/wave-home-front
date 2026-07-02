import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import settingsApi from '../../api/settingsApi';

export const initialRadarZones = [
  { id: 'room1', name: '방 1', owner: 'kim', active: true, connected: true },
  { id: 'room2', name: '방 2', owner: 'park', active: true, connected: true },
  { id: 'study', name: '서재', owner: 'kim', active: false, connected: false },
];

// docs/api/settings.md의 Device(interface/settings 중첩 구조)를 화면에서 바로 쓰기 좋은
// 평평한 view model로 변환한다. 실제 연결 상태 개념이 없는 API라 enabled를 대신 사용한다.
function toViewDevice(device) {
  const iface = device.interface || {};
  return {
    ...device,
    model: device.description,
    ip: iface.host,
    port: iface.port,
  };
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.05V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.05-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.05V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.38.18.72.42 1 .72.28.3.44.68.44 1.1v.36c0 .42-.16.8-.44 1.1-.28.3-.62.54-1 .72Z" />
    </svg>
  );
}

function DeviceThumb({ type }) {
  return (
    <div className={`device-thumb ${type}`}>
      <span />
    </div>
  );
}

function DeviceRow({ device, roomName, onOpenSettings }) {
  return (
    <div className={`device-row ${device.enabled ? 'enabled' : ''}`}>
      <DeviceThumb type={device.class} />
      <div className="device-row-main">
        <div className="device-row-title">
          <strong>{device.name}</strong>
          <em className={device.enabled ? 'online' : 'idle'}>{device.enabled ? '연결됨' : '대기'}</em>
        </div>
        <span>{device.description}</span>
        <small>{roomName} · {device.model || device.class}</small>
      </div>
      <button type="button" className="device-settings-btn" onClick={() => onOpenSettings(device)} aria-label={`${device.name} 설정`} title="기기 설정">
        <GearIcon />
      </button>
      <button type="button" className="device-remove-btn" title="더미 제거 버튼">제거</button>
    </div>
  );
}

function DetailLine({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="device-detail-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DeviceSettingsDialog({ device, roomName, onClose, onToggle }) {
  if (!device) return null;

  return (
    <div className="device-dialog-backdrop" onClick={onClose}>
      <section className="device-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="device-dialog-head">
          <DeviceThumb type={device.class} />
          <div>
            <span>기기 설정</span>
            <h3>{device.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="설정 닫기">×</button>
        </div>

        <div className="device-enable-row">
          <div>
            <strong>활성화</strong>
            <span>자동화와 에이전트 제어에 사용할지 정합니다.</span>
          </div>
          <button type="button" className={`toggle-switch ${device.enabled ? 'on' : ''}`} onClick={() => onToggle(device.id)} aria-label={`${device.name} 활성화`}>
            <i />
          </button>
        </div>

        <div className="device-detail-grid">
          <DetailLine label="연결상태" value={device.enabled ? '연결됨' : '연결 대기'} />
          <DetailLine label="공간" value={roomName} />
          <DetailLine label="모델명" value={device.model} />
          <DetailLine label="IP" value={device.ip} />
          <DetailLine label="포트" value={device.port} />
        </div>
      </section>
    </div>
  );
}

export function DeviceRegistrationSettings({ rooms }) {
  const [inputDevices, setInputDevices] = useState([]);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    settingsApi.getDevices().then(({ input_devices, output_devices }) => {
      setInputDevices(input_devices.map(toViewDevice));
      setOutputDevices(output_devices.map(toViewDevice));
    });
  }, []);

  const roomName = (roomId) => rooms.find((room) => room.id === roomId)?.name || '미지정 공간';
  const allDevices = [...inputDevices, ...outputDevices];
  const enabledCount = allDevices.filter((device) => device.enabled).length;

  const toggleDevice = async (id) => {
    const target = allDevices.find((device) => device.id === id);
    if (!target) return;
    const updated = toViewDevice(await settingsApi.updateDevice(id, { enabled: !target.enabled }));
    const apply = (device) => (device.id === id ? updated : device);
    setInputDevices((current) => current.map(apply));
    setOutputDevices((current) => current.map(apply));
    setSelectedDevice((current) => (current?.id === id ? updated : current));
  };

  return (
    <>
      <Card title="기기 등록" action={`${enabledCount}개 활성`}>
        <div className="device-summary-row">
          <div>
            <span>기기별 톱니바퀴에서 연결 정보와 활성화 설정을 확인합니다.</span>
          </div>
        </div>

        <div className="device-section">
          <h3>입력 장치</h3>
          <div className="device-list">
            {inputDevices.map((device) => (
              <DeviceRow key={device.id} device={device} roomName={roomName(device.room_id)} onOpenSettings={setSelectedDevice} />
            ))}
          </div>
        </div>

        <div className="device-section">
          <h3>출력 장치</h3>
          <div className="device-list">
            {outputDevices.map((device) => (
              <DeviceRow key={device.id} device={device} roomName={roomName(device.room_id)} onOpenSettings={setSelectedDevice} />
            ))}
          </div>
        </div>
      </Card>

      <DeviceSettingsDialog
        device={selectedDevice}
        roomName={selectedDevice ? roomName(selectedDevice.room_id) : ''}
        onClose={() => setSelectedDevice(null)}
        onToggle={toggleDevice}
      />
    </>
  );
}

export function RoomZoneSettings({ rooms, setRooms }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const addRoom = async () => {
    if (!name.trim()) return;
    const room = await settingsApi.createRoom({ name: name.trim(), description: description.trim() });
    setRooms((current) => [...current, room]);
    setName('');
    setDescription('');
  };

  return (
    <Card title="방 / 구역 등록" action={`${rooms.length}개 구역`}>
      <div className="room-zone-list">
        {rooms.map((room) => (
          <div className="room-zone-row" key={room.id}>
            <div>
              <strong>{room.name}</strong>
              <span>{room.description}</span>
            </div>
            <button type="button" className="device-remove-btn" title="더미 제거 버튼">제거</button>
          </div>
        ))}
      </div>

      <div className="room-zone-add">
        <input type="text" placeholder="방 또는 구역 이름" value={name} onChange={(event) => setName(event.target.value)} />
        <input type="text" placeholder="설명" value={description} onChange={(event) => setDescription(event.target.value)} />
        <button type="button" onClick={addRoom}>등록</button>
      </div>
    </Card>
  );
}
