import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import alarmApi from '../../api/alarmApi';
import iotApi from '../../api/iotApi';
import { AlarmEditor } from './AlarmEditor';
import { AlarmCard } from './AlarmCard';
import { isAlarmEligibleDevice, computeNextFireDate, formatCountdownLabel, sortAlarmsByTime } from './alarmUtils';
import './alarm.css';

export function AlarmPage() {
  const [alarms, setAlarms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(() => new Date());
  const rootRef = useRef(null);

  const load = () => alarmApi.getAlarms().then((list) => setAlarms(sortAlarmsByTime(list)));

  useEffect(() => {
    iotApi.getDevices().then(setDevices);
    load();
  }, []);

  // Recompute the "next alarm in ..." banner periodically.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Clicking outside the whole editor+grid area deselects the current alarm
  // and returns the wizard to "add" mode — same UX as the trigger wizard.
  useEffect(() => {
    if (!selectedAlarmId) return undefined;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setSelectedAlarmId(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [selectedAlarmId]);

  const eligibleDevices = useMemo(() => devices.filter(isAlarmEligibleDevice), [devices]);
  const radarDevices = useMemo(() => devices.filter((d) => d.class === 'srs_r4sn'), [devices]);
  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId) || null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const selectAlarm = (alarm) => {
    setSelectedAlarmId((prev) => (prev === alarm.id ? null : alarm.id));
  };

  const saveAlarm = async (payload, id) => {
    if (id) {
      await alarmApi.updateAlarm(id, payload);
      showToast('알람을 수정했습니다.');
    } else {
      await alarmApi.createAlarm(payload);
      showToast('알람을 추가했습니다.');
    }
    setSelectedAlarmId(null);
    await load();
  };

  const toggleEnabled = async (alarm) => {
    await alarmApi.updateAlarm(alarm.id, { enabled: !alarm.enabled });
    load();
  };

  const deleteAlarm = async (id) => {
    await alarmApi.deleteAlarm(id);
    if (selectedAlarmId === id) setSelectedAlarmId(null);
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
    <div className="page-stack alarm-page" ref={rootRef}>
      <Card title="알람">
        <p className="alarm-banner">{bannerLabel}</p>
      </Card>

      <Card title="알람 설정" wide>
        <AlarmEditor
          alarm={selectedAlarm}
          devices={eligibleDevices}
          radarDevices={radarDevices}
          onSave={saveAlarm}
          onDelete={deleteAlarm}
        />
      </Card>

      <Card title="알람 목록" action={`${alarms.length}개`} wide>
        {alarms.length === 0 && <p className="panel-empty">등록된 알람이 없습니다.</p>}
        <div className="alarm-card-grid">
          {alarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              selected={selectedAlarmId === alarm.id}
              onSelect={selectAlarm}
              onToggleEnabled={toggleEnabled}
            />
          ))}
        </div>
      </Card>

      {toast && <div className="iot-toast">{toast}</div>}
    </div>
  );
}
