import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Metric } from '../components/ui/Metric';
import homeApi from '../api/homeApi';
import './HomeControlPage.css';

function formatRelativeTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMinutes = Math.round((now - date) / 60000);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (date.toDateString() === now.toDateString()) {
    return `오늘 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

export function HomeControlPage({ tab, setTab }) {
  const [selectedSetId, setSelectedSetId] = useState('daily');
  const [selectedDeviceId, setSelectedDeviceId] = useState('light');
  const [openControl, setOpenControl] = useState('');
  const [openGestureId, setOpenGestureId] = useState(null);

  const [todaySummary, setTodaySummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [gestureSets, setGestureSets] = useState([]);
  const [radars, setRadars] = useState([]);
  const [radarAssignments, setRadarAssignments] = useState({});
  const [devices, setDevices] = useState([]);
  const [bindings, setBindings] = useState({});

  useEffect(() => {
    homeApi.getTodayGestureSummary().then(setTodaySummary);
    homeApi.getGestureHistory().then(setHistory);
    homeApi.getGestureSets().then(setGestureSets);
    homeApi.getRadars().then(setRadars);
    homeApi.getGestureRadarAssignments().then(setRadarAssignments);
    homeApi.getDevices().then(setDevices);
    homeApi.getDeviceBindings().then((list) => {
      const map = {};
      list.forEach((binding) => {
        map[`${binding.deviceId}:${binding.controlLabel}`] = binding;
      });
      setBindings(map);
    });
  }, []);

  const allGestures = gestureSets.flatMap((set) => set.gestures);
  const registeredGestures = allGestures.filter((g) => (radarAssignments[g.id] || []).length > 0);
  const selectedSet = gestureSets.find((set) => set.id === selectedSetId) || gestureSets[0];
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) || devices[0];
  const onlineCount = devices.filter((device) => device.connection === 'online').length;
  const availableRadars = radars.filter((r) => r.connected);
  const getRadarName = (radarId) => radars.find((r) => r.id === radarId)?.name || '';
  const getAssignedRadarIds = (gestureId) => radarAssignments[gestureId] || [];

  const toggleRadar = async (gestureId, radarId) => {
    const existing = radarAssignments[gestureId] || [];
    const next = existing.includes(radarId) ? existing.filter((id) => id !== radarId) : [...existing, radarId];
    setRadarAssignments((current) => ({ ...current, [gestureId]: next }));
    const saved = await homeApi.updateGestureRadarAssignment(gestureId, next);
    setRadarAssignments((current) => {
      const copy = { ...current };
      if (saved.radarIds.length === 0) delete copy[gestureId];
      else copy[gestureId] = saved.radarIds;
      return copy;
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
  const selectedDeviceBindingKeys = Object.keys(bindings).filter((key) => key.startsWith(`${selectedDevice.id}:`));
  const displayedBinding = selectedDeviceBindingKeys.length > 0 ? `${selectedDeviceBindingKeys.length}개 매핑됨` : '전체 미지정';
  const usedGestureIds = new Set(Object.values(bindings).map((binding) => binding.gestureId));

  const clearSelectedDeviceBindings = async () => {
    await homeApi.clearDeviceBindings(selectedDevice.id);
    setBindings((current) => {
      const next = { ...current };
      Object.keys(next)
        .filter((key) => key.startsWith(`${selectedDevice.id}:`))
        .forEach((key) => delete next[key]);
      return next;
    });
    setOpenControl('');
  };

  const setControlBinding = async (control, gesture) => {
    const saved = await homeApi.setDeviceBinding({ deviceId: selectedDevice.id, controlLabel: control.label, gestureId: gesture.id });
    setBindings((current) => ({ ...current, [getControlKey(selectedDevice.id, control.label)]: saved }));
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
          <Metric label="오늘 인식" value={todaySummary ? `${todaySummary.recognizedCount}회` : '—'} detail="최근 24시간 기준" />
          <Metric label="등록된 제스처" value={`${registeredGestures.length}개`} detail="레이더 기준" />
          <Metric label="연결 IoT" value={`${onlineCount}/${devices.length}`} detail="온라인 기기" />
        </div>

      {tab === 'history' && (
        <Card title="최근 기록" wide>
          <div className="gesture-history-list">
            {history.map((item) => (
              <article className="gesture-history-item" key={item.id}>
                <div className="gesture-history-icon">⌁</div>
                <div>
                  <strong>{item.gesture}</strong>
                  <span>{item.device} · {item.action}</span>
                </div>
                <div className="history-meta">
                  <span className="radar-tag">{item.radarName}</span>
                  <time>{formatRelativeTime(item.occurredAt)}</time>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {tab === 'list' && selectedSet && (
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

      {tab === 'iot' && selectedDevice && (
        <div className="iot-layout">
          <Card title="IoT 기기">
            <div className="iot-device-list">
              {devices.map((device) => (
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
