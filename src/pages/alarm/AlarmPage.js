import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import alarmApi from '../../api/alarmApi';
import iotApi from '../../api/iotApi';
import { getNow } from '../../lib/demoClock';
import { AlarmEditor } from './AlarmEditor';
import { AlarmCard } from './AlarmCard';
import { isAlarmEligibleDevice, computeNextFireDate, formatCountdownLabel, sortAlarmsByTime, withWaveHomeDevice } from './alarmUtils';
import './alarm.css';

export function AlarmPage() {
  const [alarms, setAlarms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(() => getNow());
  const [editorOpen, setEditorOpen] = useState(false);

  const load = () => alarmApi.getAlarms().then((list) => setAlarms(sortAlarmsByTime(list)));

  useEffect(() => {
    iotApi.getDevices().then(setDevices);
    load();
  }, []);

  // Recompute the "next alarm in ..." banner periodically.
  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 30000);
    return () => clearInterval(id);
  }, []);

  const eligibleDevices = useMemo(
    () => withWaveHomeDevice(devices.filter(isAlarmEligibleDevice)),
    [devices],
  );
  const radarDevices = useMemo(() => devices.filter((d) => d.class === 'srs_r4sn'), [devices]);
  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId) || null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // Alarm settings only ever show inside the popup now — selecting an alarm
  // (or hitting "알람 추가하기") is what opens it, and it's the only way in.
  const selectAlarm = (alarm) => {
    setSelectedAlarmId(alarm.id);
    setEditorOpen(true);
  };

  const startAddAlarm = () => {
    setSelectedAlarmId(null);
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  const saveAlarm = async (payload, id) => {
    if (id) {
      const result = await alarmApi.updateAlarm(id, payload);
      if (!result) return;
      showToast('알람을 수정했습니다.');
    } else {
      const result = await alarmApi.createAlarm(payload);
      if (!result) return;
      showToast('알람을 추가했습니다.');
    }
    setSelectedAlarmId(null);
    setEditorOpen(false);
    await load();
  };

  const toggleEnabled = async (alarm) => {
    const result = await alarmApi.updateAlarm(alarm.id, { enabled: !alarm.enabled });
    if (!result) return;
    load();
  };

  const deleteAlarm = async (id) => {
    await alarmApi.deleteAlarm(id);
    if (selectedAlarmId === id) setSelectedAlarmId(null);
    setEditorOpen(false);
    showToast('알람을 삭제했습니다.');
    load();
  };

  const bannerLabel = useMemo(() => {
    const enabled = alarms.filter((a) => a.enabled);
    if (enabled.length === 0) return '알람이 모두 꺼져있습니다.';
    const nextDate = enabled
      .map((a) => computeNextFireDate(a, now))
      .reduce((min, d) => (d < min ? d : min));
    return formatCountdownLabel(nextDate, now);
  }, [alarms, now]);

  return (
    <div className="page-stack alarm-page">
      <div className="alarm-page-intro">
        <h2 className="alarm-page-intro-title">스마트 알람</h2>
        <p className="alarm-page-intro-desc">알림과 집 안의 기기로 취침·기상 시간을 안내하며, 얕은 수면 단계에서 개운하게 깨워주는 알람이에요.</p>
      </div>

      <Card title="알람 목록" action={`${alarms.length}개`} wide className="alarm-section-card">
        <p className="alarm-banner">{bannerLabel}</p>
        {alarms.length === 0 && <p className="panel-empty">등록된 알람이 없습니다.</p>}
        <div className="alarm-card-grid">
          {alarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              selected={editorOpen && selectedAlarmId === alarm.id}
              onSelect={selectAlarm}
              onToggleEnabled={toggleEnabled}
            />
          ))}
          <button
            type="button"
            className="alarm-card alarm-card--add"
            onClick={startAddAlarm}
          >
            <span className="alarm-card-add-icon" aria-hidden="true">+</span>
            <span className="alarm-card-add-label">알람 추가하기</span>
          </button>
        </div>
      </Card>

      {editorOpen && (
        <div className="alarm-editor-overlay" onClick={closeEditor}>
          <div className="alarm-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alarm-editor-modal-head">
              <h3>알람 설정</h3>
              <button type="button" className="alarm-editor-modal-close" onClick={closeEditor} aria-label="닫기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <AlarmEditor
              alarm={selectedAlarm}
              devices={eligibleDevices}
              radarDevices={radarDevices}
              onSave={saveAlarm}
              onDelete={deleteAlarm}
            />
          </div>
        </div>
      )}

      {toast && <div className="iot-toast">{toast}</div>}
    </div>
  );
}
