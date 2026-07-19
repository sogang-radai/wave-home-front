import { useEffect, useRef, useState } from 'react';
import { isDemoHiddenDevice } from '../../api/config';
import settingsApi from '../../api/settingsApi';
import { saveRoomOrder } from '../../utils/roomOrder';
import {
  SettingsPanel,
  SettingsSection,
  SettingsModal,
  InlineEditableText,
  ConfirmDialog,
  GearIcon,
  DragHandleIcon,
  TrashIcon,
  PlusIcon,
} from './SettingsUI';
import { deviceThumbnails } from '../../utils/deviceThumbnails';

const deviceClassLabels = {
  srs_r4sn: 'mmWave 레이더',
  wave_station: 'Wave Station',
  reolink_e1_pro: 'IoT 카메라',
  droid_cam: '폰 카메라',
  tuya_ep2h: '스마트 플러그',
  tizen_tv: 'Tizen TV',
  samsung_g7: 'Samsung TV',
  philips_wiz_e29_color: 'WiZ 컬러 조명',
  philips_wiz_e29_white: 'WiZ 화이트 조명',
};

// Flattens the nested Device structure (interface/settings) into a flat view model.
// Uses `enabled` as a proxy for connection status since the API has no live status concept.
function toViewDevice(device) {
  if (!device) return null;
  const iface = device.interface || {};
  const settings = device.settings && typeof device.settings === 'object' ? device.settings : {};
  return {
    ...device,
    settings,
    ip: iface.host,
    mac: iface.mac,
    port: iface.port,
    classLabel: deviceClassLabels[device.class] || device.class,
    companion: !!settings.companion,
  };
}

function DeviceThumb({ deviceClass, size = 'row' }) {
  const src = deviceThumbnails[deviceClass];
  if (src) {
    return <img className={`device-thumb-img ${size}`} src={src} alt="" />;
  }
  return <div className={`device-thumb-placeholder ${size}`} aria-hidden="true" />;
}

function DeviceRow({ device, roomName, onRename, onToggle, onOpenSettings }) {
  return (
    <div className={`device-flat-row ${device.enabled ? 'enabled' : ''}`}>
      <span className="device-drag-holder" aria-hidden="true">
        <DragHandleIcon width={16} height={16} />
      </span>
      <DeviceThumb deviceClass={device.class} />
      <div className="device-flat-main">
        <div className="device-flat-title">
          <InlineEditableText
            value={device.name}
            ariaLabel="기기 이름"
            className="device-flat-name"
            onCommit={(name) => onRename(device.id, name)}
          />
          {device.enabled && <em className="device-status-tag">작동 중</em>}
        </div>
        <span className="device-flat-desc">{device.description}</span>
        <small>{roomName}{device.vendor ? ` · ${device.vendor}` : ''} · {device.model || device.classLabel}</small>
      </div>
      <button
        type="button"
        className="device-settings-btn"
        onClick={() => onOpenSettings(device)}
        aria-label={`${device.name} 설정`}
        title="기기 설정"
      >
        <GearIcon />
      </button>
      <button
        type="button"
        className={`toggle-switch ${device.enabled ? 'on' : ''}`}
        onClick={() => onToggle(device.id)}
        aria-label={`${device.name} 활성화`}
      >
        <i />
      </button>
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

function DeviceSettingsDialog({ device, roomName, onClose, onRename, onDelete, onToggleCompanion }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!device) return null;

  const isWaveStation = device.class === 'wave_station';

  return (
    <div className="device-dialog-backdrop" onClick={onClose}>
      <section className="device-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="device-dialog-head">
          <DeviceThumb deviceClass={device.class} size="dialog" />
          <div>
            <span className="device-dialog-label">기기 설정</span>
            <InlineEditableText
              value={device.name}
              ariaLabel="기기 이름"
              className="device-dialog-name"
              onCommit={(name) => onRename(device.id, name)}
            />
          </div>
          <button type="button" onClick={onClose} aria-label="설정 닫기">×</button>
        </div>

        <div className="device-detail-grid">
          <DetailLine label="모델" value={device.model} />
          <DetailLine label="종류" value={device.classLabel} />
          <DetailLine label="구역" value={roomName} />
          <DetailLine label="연결 상태" value={device.enabled ? '활성' : '비활성'} />
          <DetailLine label="IP" value={device.ip} />
          <DetailLine label="MAC" value={device.mac} />
          <DetailLine label="포트" value={device.port} />
        </div>

        {isWaveStation && (
          <div className="device-companion-row">
            <div>
              <strong>동반자 모드</strong>
              <p>Wave Station 마이크로 말하면 에이전트가 응답합니다.</p>
            </div>
            <button
              type="button"
              className={`toggle-switch ${device.companion ? 'on' : ''}`}
              onClick={() => onToggleCompanion?.(device.id, !device.companion)}
              aria-label="동반자 모드 토글"
            >
              <i />
            </button>
          </div>
        )}

        <div className="device-dialog-footer">
          {/* Dummy: calls mock deleteDevice after confirm — removes from in-memory list only. */}
          <button type="button" className="device-delete-link" onClick={() => setConfirmOpen(true)}>
            <TrashIcon width={16} height={16} />
            기기 제거
          </button>
          <div className="device-dialog-footer-right">
            <button type="button" className="settings-btn-ghost" onClick={onClose}>취소</button>
            <button type="button" className="settings-btn-primary" onClick={onClose}>확인</button>
          </div>
        </div>
      </section>

      {confirmOpen && (
        <ConfirmDialog
          title="기기를 제거할까요?"
          message={`'${device.name}' 기기를 목록에서 제거합니다.`}
          confirmLabel="제거"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onDelete(device.id);
          }}
        />
      )}
    </div>
  );
}

export function DeviceRegistrationSettings({ heading, rooms }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    // 등록된 전체 장치를 연결 상태와 무관하게 표시한다.
    settingsApi.getDevices().then(({ input_devices, output_devices }) => {
      setDevices(
        [...input_devices, ...output_devices]
          .map(toViewDevice)
          .filter((device) => device && !isDemoHiddenDevice(device)),
      );
    });
  }, []);

  const roomName = (roomId) => rooms.find((room) => room.id === roomId)?.name || '미지정 구역';
  const enabledCount = devices.filter((device) => device.enabled).length;

  const applyUpdate = (updated) => {
    if (!updated) return;
    const view = toViewDevice(updated);
    if (!view) return;
    setDevices((current) => current.map((device) => (device.id === view.id ? view : device)));
    setSelectedDevice((current) => (current?.id === view.id ? view : current));
  };

  // Optimistic toggle: flip state immediately, then sync with API response.
  const toggleDevice = (id) => {
    const target = devices.find((device) => device.id === id);
    if (!target) return;
    const optimistic = { ...target, enabled: !target.enabled };
    setDevices((current) => current.map((device) => (device.id === id ? optimistic : device)));
    setSelectedDevice((current) => (current?.id === id ? optimistic : current));
    settingsApi.updateDevice(id, { enabled: optimistic.enabled })
      .then((updated) => applyUpdate(updated))
      .catch(() => {
        // Revert to original state on API failure.
        setDevices((current) => current.map((device) => (device.id === id ? target : device)));
        setSelectedDevice((current) => (current?.id === id ? target : current));
      });
  };

  const renameDevice = async (id, name) => {
    applyUpdate(await settingsApi.updateDevice(id, { name }));
  };

  const deleteDevice = async (id) => {
    await settingsApi.deleteDevice(id);
    setDevices((current) => current.filter((device) => device.id !== id));
    setSelectedDevice(null);
  };

  const toggleCompanion = (id, companion) => {
    const target = devices.find((device) => device.id === id);
    if (!target) return;
    const nextSettings = { ...(target.settings || {}), companion };
    const optimistic = { ...target, settings: nextSettings, companion };
    setDevices((current) => current.map((device) => (device.id === id ? optimistic : device)));
    setSelectedDevice((current) => (current?.id === id ? optimistic : current));
    settingsApi.updateDevice(id, { settings: nextSettings })
      .then((updated) => applyUpdate(updated))
      .catch(() => {
        setDevices((current) => current.map((device) => (device.id === id ? target : device)));
        setSelectedDevice((current) => (current?.id === id ? target : current));
      });
  };

  return (
    <SettingsPanel heading={heading} description="집에 연결된 장치의 이름과 활성화 상태, 연결 정보를 관리합니다.">
      <SettingsSection
        title="연결된 장치"
        action={
          <div className="settings-section-action-row">
            <span className="settings-count-pill">{enabledCount}개 활성</span>
            {/* Dummy: device registration flow is not yet implemented. */}
            <button type="button" className="settings-add-btn" title="준비 중">
              <PlusIcon width={16} height={16} />
              장치 추가
            </button>
          </div>
        }
      >
        <div className="device-flat-list">
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              roomName={roomName(device.room_id)}
              onRename={renameDevice}
              onToggle={toggleDevice}
              onOpenSettings={setSelectedDevice}
            />
          ))}
        </div>
      </SettingsSection>

      <DeviceSettingsDialog
        device={selectedDevice}
        roomName={selectedDevice ? roomName(selectedDevice.room_id) : ''}
        onClose={() => setSelectedDevice(null)}
        onRename={renameDevice}
        onDelete={deleteDevice}
        onToggleCompanion={toggleCompanion}
      />
    </SettingsPanel>
  );
}

function RoomAddModal({ onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), description: description.trim() });
  };

  return (
    <SettingsModal
      title="구역 추가"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="settings-btn-ghost" onClick={onClose}>취소</button>
          <button type="button" className="settings-btn-primary" onClick={submit} disabled={!name.trim()}>추가</button>
        </>
      }
    >
      <label className="settings-field">
        <span>구역 이름</span>
        <input type="text" placeholder="예: 거실" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </label>
      <label className="settings-field">
        <span>설명 (선택)</span>
        <input type="text" placeholder="예: 소파와 TV가 있는 공간" value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
    </SettingsModal>
  );
}

function RoomMembersPanel({ accounts, members, onChange }) {
  const safeAccounts = (accounts || []).filter(Boolean);
  const memberIds = (members || []).map((id) => String(id));
  const memberAccounts = safeAccounts.filter((account) => memberIds.includes(String(account.id)));
  const candidates = safeAccounts.filter((account) => !memberIds.includes(String(account.id)));

  return (
    <div className="room-detail-panel">
      <h4>구성원</h4>
      <div className="room-chip-list">
        {memberAccounts.length === 0 && <p className="room-detail-empty">배정된 구성원이 없습니다.</p>}
        {memberAccounts.map((account) => (
          <span className="room-chip" key={account.id}>
            <span className="mini-avatar">{account.name?.charAt(0) || '?'}</span>
            {account.name}
            <button
              type="button"
              aria-label={`${account.name} 제외`}
              onClick={() => onChange(members.filter((id) => String(id) !== String(account.id)))}
            >×</button>
          </span>
        ))}
      </div>
      {candidates.length > 0 && (
        <select
          className="settings-select room-add-select"
          value=""
          onChange={(event) => {
            const raw = event.target.value;
            const matched = safeAccounts.find((a) => String(a.id) === String(raw));
            onChange([...members, matched ? matched.id : raw]);
          }}
        >
          <option value="" disabled>구성원 추가…</option>
          {candidates.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function RoomDevicesPanel({ roomId, devices, onAssign, onUnassign }) {
  const roomDevices = devices.filter((device) => device.room_id === roomId);
  const others = devices.filter((device) => device.room_id !== roomId);

  return (
    <div className="room-detail-panel">
      <h4>연결된 장치</h4>
      <div className="room-device-list">
        {roomDevices.length === 0 && <p className="room-detail-empty">연결된 장치가 없습니다.</p>}
        {roomDevices.map((device) => (
          <div className="room-device-item" key={device.id}>
            <DeviceThumb deviceClass={device.class} />
            <div className="device-flat-main">
              <strong>{device.name}</strong>
              <small>{device.vendor ? `${device.vendor} · ` : ''}{device.model || device.classLabel}</small>
            </div>
            {/* Dummy: calls mock unassignDeviceFromRoom — clears room assignment only. */}
            <button
              type="button"
              className="room-device-remove"
              aria-label={`${device.name} 제외`}
              onClick={() => onUnassign(device.id)}
            >
              <TrashIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
      {others.length > 0 && (
        <select
          className="settings-select room-add-select"
          value=""
          onChange={(event) => onAssign(event.target.value)}
        >
          <option value="" disabled>장치 추가…</option>
          {others.map((device) => (
            <option key={device.id} value={device.id}>{device.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export function RoomZoneSettings({ heading, rooms, setRooms, accounts }) {
  const [devices, setDevices] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [members, setMembers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [dragId, setDragId] = useState(null);
  const defaultSelected = useRef(false);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;

  // Auto-select the first room when rooms load for the first time.
  useEffect(() => {
    if (!defaultSelected.current && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
      defaultSelected.current = true;
    }
  }, [rooms]);

  const loadDevices = () => {
    settingsApi.getDevices().then(({ input_devices, output_devices }) => {
      setDevices(
        [...input_devices, ...output_devices]
          .map(toViewDevice)
          .filter((device) => device && !isDemoHiddenDevice(device)),
      );
    });
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setMembers([]);
      return;
    }
    settingsApi.getRoomMembers(selectedRoomId).then(setMembers);
  }, [selectedRoomId]);

  const selectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setDeleteError('');
  };

  const addRoom = async ({ name, description }) => {
    const room = await settingsApi.createRoom({ name, description });
    if (!room) return;
    setRooms((current) => [...current.filter(Boolean), room]);
    setAddOpen(false);
  };

  const patchRoom = async (roomId, patch) => {
    const updated = await settingsApi.updateRoom(roomId, patch);
    if (!updated) return;
    setRooms((current) => current.map((room) => (room?.id === roomId ? updated : room)).filter(Boolean));
  };

  const deleteRoom = async (roomId) => {
    await settingsApi.deleteRoom(roomId);
    setRooms((current) => {
      const next = current.filter((room) => room.id !== roomId);
      if (selectedRoomId === roomId) {
        setSelectedRoomId(next[0]?.id || null);
      }
      return next;
    });
  };

  const updateMembers = async (nextMembers) => {
    setMembers(nextMembers);
    await settingsApi.updateRoomMembers(selectedRoomId, nextMembers);
  };

  const assignDevice = async (deviceId) => {
    await settingsApi.assignDeviceToRoom(deviceId, selectedRoomId);
    loadDevices();
  };

  const unassignDevice = async (deviceId) => {
    await settingsApi.unassignDeviceFromRoom(deviceId);
    loadDevices();
  };

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ordered = [...rooms];
    const from = ordered.findIndex((room) => room.id === dragId);
    const to = ordered.findIndex((room) => room.id === targetId);
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    setRooms(ordered);
    setDragId(null);
    saveRoomOrder(ordered.map((room) => room.id));
  };

  const deletingRoom = rooms.find((room) => room.id === deletingRoomId) || null;

  return (
    <SettingsPanel heading={heading} description="장치가 놓인 구역을 만들고 구성원과 장치를 배정합니다.">
      <SettingsSection
        title="구역 목록"
        action={
          <button type="button" className="settings-add-btn" onClick={() => setAddOpen(true)}>
            <PlusIcon width={16} height={16} />
            구역 추가
          </button>
        }
      >
        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`room-row ${selectedRoomId === room.id ? 'selected' : ''}`}
              draggable
              onDragStart={() => setDragId(room.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(room.id)}
              onClick={() => selectRoom(room.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectRoom(room.id);
                }
              }}
            >
              <span className="room-drag-handle" aria-hidden="true">
                <DragHandleIcon width={16} height={16} />
              </span>
              <div className="room-row-main">
                <strong>{room.name}</strong>
                <span>{room.description}</span>
              </div>
              <button
                type="button"
                className="room-card-delete"
                aria-label={`${room.name} 구역 제거`}
                onClick={(event) => {
                  event.stopPropagation();
                  setDeletingRoomId(room.id);
                }}
              >
                <TrashIcon width={15} height={15} />
              </button>
            </div>
          ))}
        </div>
      </SettingsSection>

      {selectedRoom && (
        <SettingsSection title="구역 구성">
          <div className="room-config-fields">
            <label className="room-config-field">
              <span>구역 이름</span>
              <InlineEditableText
                value={selectedRoom.name}
                ariaLabel="구역 이름"
                onCommit={(name) => patchRoom(selectedRoom.id, { name })}
              />
            </label>
            <label className="room-config-field">
              <span>설명</span>
              <InlineEditableText
                value={selectedRoom.description || ''}
                ariaLabel="구역 설명"
                onCommit={(description) => patchRoom(selectedRoom.id, { description })}
              />
            </label>
          </div>
          <RoomMembersPanel
            roomId={selectedRoom.id}
            accounts={accounts}
            members={members}
            onChange={updateMembers}
          />
          <RoomDevicesPanel
            roomId={selectedRoom.id}
            devices={devices}
            onAssign={assignDevice}
            onUnassign={unassignDevice}
          />
          {deleteError && <p className="settings-field-error">{deleteError}</p>}
        </SettingsSection>
      )}

      {addOpen && <RoomAddModal onConfirm={addRoom} onClose={() => setAddOpen(false)} />}

      {deletingRoom && (
        <ConfirmDialog
          title="구역을 제거할까요?"
          message={`'${deletingRoom.name}' 구역을 제거합니다.`}
          confirmLabel="제거"
          onCancel={() => { setDeletingRoomId(null); setDeleteError(''); }}
          onConfirm={async () => {
            const id = deletingRoomId;
            setDeletingRoomId(null);
            try {
              await deleteRoom(id);
            } catch (err) {
              setDeleteError(err.code === 'ROOM_HAS_DEVICES' ? '이 구역에 연결된 장치가 있어 제거할 수 없습니다.' : '구역을 제거할 수 없습니다.');
            }
          }}
        />
      )}
    </SettingsPanel>
  );
}
