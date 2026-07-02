import { useState } from 'react';
import { Card } from '../../components/ui/Card';

export const initialRooms = [
  { id: '7c4a9e2f18b356d0', name: '책상', description: '책상' },
  { id: '3f91c6e52ad047b8', name: '침실', description: '침실' },
];

export const initialRadarZones = [
  { id: 'room1', name: '방 1', owner: 'kim', active: true, connected: true },
  { id: 'room2', name: '방 2', owner: 'park', active: true, connected: true },
  { id: 'study', name: '서재', owner: 'kim', active: false, connected: false },
];

const initialInputDevices = [
  {
    id: '8d2e5a1c49f7036b',
    room_id: '7c4a9e2f18b356d0',
    name: '거실 레이더',
    description: 'Retina-4SN mmWave 레이더',
    enabled: true,
    connected: true,
    class: 'srs_r4sn',
    model: 'Retina-4SN',
    ip: '192.168.0.33',
    mac: 'A4:C1:38:24:9B:11',
    pointCount: 1284,
  },
  {
    id: '1a6f3e8d02c75491',
    room_id: '3f91c6e52ad047b8',
    name: '침실 마이크',
    description: 'ESP32 + I2S 마이크',
    enabled: true,
    connected: true,
    class: 'wave_mic',
    model: 'ESP32 + INMP441',
    ip: '192.168.0.50',
    mac: '30:AE:A4:92:17:C2',
    micLevel: 68,
  },
  {
    id: 'c5281a7e93bf406d',
    room_id: '3f91c6e52ad047b8',
    name: '침실 카메라',
    description: 'DroidCam 자세 교정 카메라',
    enabled: true,
    connected: true,
    class: 'wave_cam',
    model: 'DroidCam',
    ip: '192.168.0.51',
    mac: '5C:E9:1E:7B:41:09',
    port: 4747,
  },
];

const initialOutputDevices = [
  {
    id: '0f8c2d6b147ae953',
    room_id: '7c4a9e2f18b356d0',
    name: '거실 에어컨 IR',
    description: 'IR Remote · LIRC 송신',
    enabled: true,
    connected: true,
    class: 'ir_remote',
    model: 'Raspberry Pi 5 LIRC',
    status: 'Pi 5에 연결됨',
  },
  {
    id: '5e3b80a1f2496cde',
    room_id: '7c4a9e2f18b356d0',
    name: '거실 TV',
    description: '삼성 32인치 모니터',
    enabled: true,
    connected: true,
    class: 'tizen_tv',
    model: 'Samsung 32 inch',
    ip: '192.168.0.70',
    mac: '60:6B:BD:80:32:10',
    port: 8002,
  },
  {
    id: '9a4c71e36b0285fd',
    room_id: '7c4a9e2f18b356d0',
    name: '거실 스마트 플러그',
    description: 'EP2-H Tuya IoT Plug',
    enabled: true,
    connected: true,
    class: 'tuya_ep2h',
    model: 'EP2-H',
    ip: '192.168.0.37',
    mac: 'E8:DB:84:11:78:44',
  },
  {
    id: 'd7139e58a04b6c21',
    room_id: '3f91c6e52ad047b8',
    name: '침실 조명',
    description: 'Philips Hue 조명 더미',
    enabled: true,
    connected: true,
    class: 'hue_light',
    model: 'Hue White',
    ip: '192.168.0.80',
    mac: '00:17:88:64:AB:02',
  },
];

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
          <em className={device.connected ? 'online' : 'idle'}>{device.connected ? '연결됨' : '대기'}</em>
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
          <DetailLine label={device.class === 'ir_remote' ? '상태' : '연결상태'} value={device.class === 'ir_remote' ? device.status : device.connected ? '연결됨' : '연결 대기'} />
          <DetailLine label="공간" value={roomName} />
          <DetailLine label="모델명" value={device.model} />
          <DetailLine label="IP" value={device.ip} />
          <DetailLine label="MAC" value={device.mac} />
          <DetailLine label="포트" value={device.port} />
          <DetailLine label="실시간 포인트 수" value={device.pointCount?.toLocaleString()} />
        </div>

        {device.class === 'wave_mic' && (
          <div className="mic-level-block">
            <div>
              <span>마이크 수신</span>
              <strong>{device.micLevel}%</strong>
            </div>
            <div className="mic-level-bar">
              <i style={{ width: `${device.micLevel}%` }} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function DeviceRegistrationSettings({ rooms }) {
  const [inputDevices, setInputDevices] = useState(initialInputDevices);
  const [outputDevices, setOutputDevices] = useState(initialOutputDevices);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const roomName = (roomId) => rooms.find((room) => room.id === roomId)?.name || '미지정 공간';
  const allDevices = [...inputDevices, ...outputDevices];
  const enabledCount = allDevices.filter((device) => device.enabled).length;

  const toggleDevice = (id) => {
    const toggle = (device) => (device.id === id ? { ...device, enabled: !device.enabled } : device);
    setInputDevices((current) => current.map(toggle));
    setOutputDevices((current) => current.map(toggle));
    setSelectedDevice((current) => (current?.id === id ? { ...current, enabled: !current.enabled } : current));
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

  const addRoom = () => {
    if (!name.trim()) return;
    setRooms((current) => [
      ...current,
      { id: `room-${Date.now()}`, name: name.trim(), description: description.trim() || name.trim() },
    ]);
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
