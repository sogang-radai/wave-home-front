import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Metric } from '../components/ui/Metric';
import { gestureHistory, gestureSets, iotDevices } from '../data/homeData';
import { initialRadarZones } from './settings/DeviceSettings';
import './HomeControlPage.css';

export function HomeControlPage() {
  const [tab, setTab] = useState('history');
  const [selectedSetId, setSelectedSetId] = useState('daily');
  const [selectedDeviceId, setSelectedDeviceId] = useState('light');
  const [openControl, setOpenControl] = useState('');
  const [openGestureId, setOpenGestureId] = useState(null);
  const [bindings, setBindings] = useState({});
  const [radarAssignments, setRadarAssignments] = useState(() =>
    Object.fromEntries(
      gestureSets.flatMap((set) => set.gestures)
        .filter((g) => g.radars && g.radars.length > 0)
        .map((g) => [g.id, g.radars])
    )
  );

  const allGestures = gestureSets.flatMap((set) => set.gestures);
  const registeredGestures = allGestures.filter((g) => (radarAssignments[g.id] || []).length > 0);
  const selectedSet = gestureSets.find((set) => set.id === selectedSetId) || gestureSets[0];
  const selectedDevice = iotDevices.find((device) => device.id === selectedDeviceId) || iotDevices[0];
  const onlineCount = iotDevices.filter((device) => device.connection === 'online').length;
  const availableRadars = initialRadarZones.filter((r) => r.connected);
  const getRadarName = (radarId) => initialRadarZones.find((r) => r.id === radarId)?.name || '';
  const getAssignedRadarIds = (gestureId) => radarAssignments[gestureId] || [];

  const toggleRadar = (gestureId, radarId) => {
    setRadarAssignments((current) => {
      const existing = current[gestureId] || [];
      const next = { ...current };
      if (existing.includes(radarId)) {
        const updated = existing.filter((id) => id !== radarId);
        if (updated.length === 0) {
          delete next[gestureId];
        } else {
          next[gestureId] = updated;
        }
      } else {
        next[gestureId] = [...existing, radarId];
      }
      return next;
    });
  };

  const getAssignedLabel = (gestureId) => {
    const ids = getAssignedRadarIds(gestureId);
    if (ids.length === 0) return '미등록';
    if (ids.length === 1) return getRadarName(ids[0]);
    return `${getRadarName(ids[0])} 외 ${ids.length - 1}개`;
  };

  const getControlKey = (deviceId, controlLabel) => `${deviceId}:${controlLabel}`;
  const getControlBinding = (control) => bindings[getControlKey(selectedDevice.id, control.label)];
  const selectedDeviceBindings = Object.entries(bindings).filter(([key]) => key.startsWith(`${selectedDevice.id}:`));
  const displayedBinding = selectedDeviceBindings.length > 0 ? `${selectedDeviceBindings.length}개 매핑됨` : '전체 미지정';
  const usedGestureIds = new Set(Object.values(bindings).map((binding) => binding.gestureId));

  const clearSelectedDeviceBindings = () => {
    setBindings((current) => {
      const next = { ...current };
      selectedDevice.controls.forEach((control) => { delete next[getControlKey(selectedDevice.id, control.label)]; });
      return next;
    });
    setOpenControl('');
  };

  const setControlBinding = (control, gesture) => {
    setBindings((current) => ({
      ...current,
      [getControlKey(selectedDevice.id, control.label)]: {
        gestureId: gesture.id,
        gestureName: gesture.name,
        action: gesture.action,
      },
    }));
    setOpenControl('');
  };

  return (
    <div className="page-stack">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          ['history', '제스처 히스토리'],
          ['list', '제스처 목록'],
          ['iot', 'IoT 상태'],
        ]}
      />

      <div className="home-summary-grid">
        <Metric label="오늘 인식" value="18회" detail="더미 데이터 기준" />
        <Metric label="등록된 제스처" value={`${registeredGestures.length}개`} detail="레이더 기준" />
        <Metric label="연결 IoT" value={`${onlineCount}/${iotDevices.length}`} detail="온라인 기기" />
      </div>

      {tab === 'history' && (
        <Card title="최근 기록" wide>
          <div className="gesture-history-list">
            {gestureHistory.map((item) => (
              <article className="gesture-history-item" key={item.id}>
                <div className="gesture-history-icon">⌁</div>
                <div>
                  <strong>{item.gesture}</strong>
                  <span>{item.device} · {item.action}</span>
                </div>
                <div className="history-meta">
                  <span className="radar-tag">{item.radar}</span>
                  <time>{item.time}</time>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {tab === 'list' && (
        <div className="gesture-management">
          <div className="gesture-set-list">
            {gestureSets.map((set) => {
              const registeredCount = set.gestures.filter((g) => (radarAssignments[g.id] || []).length > 0).length;
              return (
                <article
                  className={`gesture-set-card ${selectedSetId === set.id ? 'selected' : ''} ${registeredCount > 0 ? 'active-set' : ''}`}
                  key={set.id}
                >
                  <button type="button" className="gesture-set-select-button" onClick={() => setSelectedSetId(set.id)}>
                    <span>{registeredCount > 0 ? `${registeredCount}개 등록됨` : '미등록'}</span>
                    <strong>{set.name}</strong>
                    <p>{set.description}</p>
                    <small>{set.gestures.length}개 제스처</small>
                  </button>
                </article>
              );
            })}
          </div>

          <Card title={selectedSet.name} wide>
            <p className="section-description">{selectedSet.description}</p>
            <div className="gesture-card-grid">
              {selectedSet.gestures.map((gesture) => {
                const assignedIds = getAssignedRadarIds(gesture.id);
                const isOpen = openGestureId === gesture.id;
                return (
                  <article className="gesture-control-card" key={gesture.id}>
                    <div className="gesture-placeholder">
                      <span>사진 없음</span>
                    </div>
                    <div className="gesture-card-body">
                      <span className={`status-chip ${assignedIds.length > 0 ? 'active' : 'inactive'}`}>
                        {getAssignedLabel(gesture.id)}
                      </span>
                      <h3>{gesture.name}</h3>
                      <p>{gesture.action}</p>
                      <button
                        type="button"
                        className="radar-assign-btn"
                        onClick={() => setOpenGestureId(isOpen ? null : gesture.id)}
                      >
                        {assignedIds.length > 0 ? '레이더 관리' : '레이더 등록'}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="radar-picker">
                        {availableRadars.map((radar) => {
                          const isSelected = assignedIds.includes(radar.id);
                          return (
                            <button
                              type="button"
                              className={`radar-pick-item ${isSelected ? 'selected' : ''}`}
                              key={radar.id}
                              onClick={() => toggleRadar(gesture.id, radar.id)}
                            >
                              <span>{isSelected ? '✓ ' : ''}{radar.name}</span>
                              <small>레이더</small>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'iot' && (
        <div className="iot-layout">
          <Card title="IoT 기기">
            <div className="iot-device-list">
              {iotDevices.map((device) => (
                <button
                  className={`iot-device-row ${selectedDevice.id === device.id ? 'selected' : ''}`}
                  key={device.id}
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  <span className={`device-dot ${device.connection}`} />
                  <div>
                    <strong>{device.name}</strong>
                    <small>{device.room}</small>
                  </div>
                  <em>{device.connection === 'online' ? '온라인' : '대기'}</em>
                </button>
              ))}
            </div>
          </Card>

          <Card title={`${selectedDevice.name} 제어 상태`} wide>
            <div className="selected-device-panel">
              <div>
                <span className={`device-dot ${selectedDevice.connection}`} />
                <strong>{selectedDevice.state}</strong>
                <p>{displayedBinding}</p>
              </div>
              <button type="button" onClick={clearSelectedDeviceBindings}>전체 초기화</button>
            </div>

            <div className="control-binding-list">
              {selectedDevice.controls.map((control) => {
                const binding = getControlBinding(control);
                return (
                  <article className="control-binding-item" key={control.label}>
                    <div className="control-binding-row">
                      <div>
                        <strong>{control.label}</strong>
                        <span>연결된 제스처: {binding?.gestureName || '미지정'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenControl((current) => (current === control.label ? '' : control.label))}
                      >
                        설정
                      </button>
                    </div>
                    {openControl === control.label && (
                      <div className="gesture-picker">
                        {registeredGestures.length === 0 && (
                          <p className="gesture-picker-empty">레이더가 등록된 제스처가 없습니다.</p>
                        )}
                        {registeredGestures.map((gesture) => {
                          const currentGesture = binding?.gestureId === gesture.id;
                          const usedElsewhere = usedGestureIds.has(gesture.id) && !currentGesture;
                          return (
                            <button
                              type="button"
                              className={currentGesture ? 'selected' : ''}
                              disabled={usedElsewhere}
                              key={gesture.id}
                              onClick={() => setControlBinding(control, gesture)}
                            >
                              <span>{gesture.name}</span>
                              <small>
                                {usedElsewhere
                                  ? '다른 제어에 사용 중'
                                  : `${getAssignedLabel(gesture.id)} · ${gesture.action}`}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
