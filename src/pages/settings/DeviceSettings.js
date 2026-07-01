import { useState } from 'react';
import { Card } from '../../components/ui/Card';

export const initialRadarZones = [
  { id: 'room1', name: '방 1', owner: 'kim', active: true, connected: true },
  { id: 'room2', name: '방 2', owner: 'park', active: true, connected: true },
  { id: 'study', name: '서재', owner: 'kim', active: false, connected: false },
];

export function DeviceRegistrationSettings({ accounts }) {
  const [zones, setZones] = useState(initialRadarZones);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneOwner, setNewZoneOwner] = useState(accounts[0]?.id || '');

  const ownerName = (ownerId) => accounts.find((item) => item.id === ownerId)?.name || '공용';
  const connectedCount = zones.filter((zone) => zone.connected).length;
  const allConnected = zones.length > 0 && connectedCount === zones.length;

  const toggleZone = (id) => {
    setZones((current) => current.map((zone) => (zone.id === id ? { ...zone, active: !zone.active } : zone)));
  };

  const removeZone = (id) => {
    setZones((current) => current.filter((zone) => zone.id !== id));
  };

  const addZone = () => {
    if (!newZoneName.trim()) return;
    setZones((current) => [
      ...current,
      { id: `zone-${Date.now()}`, name: newZoneName.trim(), owner: newZoneOwner, active: true, connected: true },
    ]);
    setNewZoneName('');
  };

  return (
    <Card title="레이더 관리" action={`${zones.filter((zone) => zone.active).length}개 활성`}>
      <div className={`radar-status-row ${allConnected ? '' : 'warn'}`}>
        <span className="pulse" />
        <div>
          <strong>{allConnected ? '레이더 연결됨' : '일부 레이더 연결 끊김'}</strong>
          <span>등록된 구역 {zones.length}개 · 연결 {connectedCount}개</span>
        </div>
      </div>

      <div className="zone-list">
        {zones.map((zone) => (
          <div className={`zone-row ${zone.active ? 'active' : ''}`} key={zone.id}>
            <span className={`device-dot ${zone.connected ? 'online' : 'idle'}`} />
            <div className="zone-info">
              <strong>{zone.name}</strong>
              <span>{ownerName(zone.owner)}의 구역 · {zone.connected ? '연결됨' : '연결 끊김'}</span>
            </div>
            <div className="zone-actions">
              <button
                type="button"
                className={`toggle-switch ${zone.active ? 'on' : ''}`}
                onClick={() => toggleZone(zone.id)}
                aria-label={`${zone.name} 레이더 토글`}
              >
                <i />
              </button>
              <button
                type="button"
                className="zone-delete"
                onClick={() => removeZone(zone.id)}
                aria-label={`${zone.name} 삭제`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="zone-add-row">
        <input
          type="text"
          placeholder="구역 이름 (예: 거실)"
          value={newZoneName}
          onChange={(event) => setNewZoneName(event.target.value)}
        />
        <select value={newZoneOwner} onChange={(event) => setNewZoneOwner(event.target.value)}>
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={addZone}>구역 추가</button>
      </div>
    </Card>
  );
}
