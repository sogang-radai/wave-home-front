import { useEffect, useState } from 'react';
import { PencilIcon } from '../iot/icons';
import { TimeWheelPicker } from './TimeWheelPicker';
import { AlarmDevicePicker } from './AlarmDevicePicker';
import { AlarmMethodPanel } from './AlarmMethodPanel';
import { InfoTooltip } from './InfoTooltip';
import {
  DAYS_ORDER, DAY_OF_WEEK_LABELS, methodGroupFor, defaultMethodFor,
  formatClock12, timeMinuteFrom, validateAlarmDraft,
} from './alarmUtils';

function emptyDraft() {
  return {
    name: '',
    hour12: 7,
    minute: 0,
    meridiem: 'AM',
    daysOfWeek: [],
    smartWake: false,
    radarDeviceId: '',
    deviceId: '',
    method: null,
    enabled: true,
  };
}

function draftFromAlarm(alarm) {
  return {
    name: alarm.name,
    ...formatClock12(alarm.timeMinute),
    daysOfWeek: alarm.daysOfWeek || [],
    smartWake: alarm.smartWake,
    radarDeviceId: alarm.radarDeviceId || '',
    deviceId: alarm.deviceId || '',
    method: alarm.method,
    enabled: alarm.enabled,
  };
}

export function AlarmEditor({ alarm, devices, radarDevices, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => (alarm ? draftFromAlarm(alarm) : emptyDraft()));
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setDraft(alarm ? draftFromAlarm(alarm) : emptyDraft());
    setSubmitError('');
  }, [alarm]);

  const selectedDevice = devices.find((d) => d.id === draft.deviceId) || null;

  const toggleDay = (day) => {
    const next = draft.daysOfWeek.includes(day)
      ? draft.daysOfWeek.filter((d) => d !== day)
      : [...draft.daysOfWeek, day];
    setDraft((d) => ({ ...d, daysOfWeek: next }));
  };

  const setDevice = (deviceId) => {
    const device = devices.find((d) => d.id === deviceId) || null;
    const group = methodGroupFor(device);
    setDraft((d) => ({ ...d, deviceId, method: defaultMethodFor(group) }));
  };

  const validationHint = validateAlarmDraft(draft);
  const canSave = !validationHint;

  const submit = async () => {
    if (validationHint) {
      setSubmitError(validationHint);
      return;
    }
    setSubmitError('');
    const payload = {
      name: draft.name,
      timeMinute: timeMinuteFrom(draft.hour12, draft.minute, draft.meridiem),
      daysOfWeek: draft.daysOfWeek,
      smartWake: draft.smartWake,
      radarDeviceId: draft.smartWake ? draft.radarDeviceId || null : null,
      deviceId: draft.deviceId,
      method: draft.method,
      enabled: draft.enabled,
    };
    try {
      await onSave(payload, alarm?.id);
    } catch (err) {
      setSubmitError(err.message || '저장에 실패했습니다.');
    }
  };

  return (
    <div className="alarm-editor">
      <div className="alarm-editor-header">
        <label className="settings-field">
          <span>알람 이름</span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => { setDraft((d) => ({ ...d, name: e.target.value })); setSubmitError(''); }}
            placeholder="예: 평일 기상"
          />
        </label>
        <button type="button" className="settings-btn-primary alarm-editor-save-btn" disabled={!canSave} onClick={submit}>
          {alarm ? (<><PencilIcon width={14} height={14} /> 수정</>) : '+ 추가'}
        </button>
        {alarm && onDelete && (
          <button type="button" className="settings-delete-link" onClick={() => onDelete(alarm.id)}>삭제</button>
        )}
        {(submitError || (!canSave && draft.name.trim() && validationHint)) && (
          <p className="alarm-editor-header-error">{submitError || validationHint}</p>
        )}
      </div>

      <div className="alarm-wizard">
        <div className="alarm-wizard-step alarm-wizard-step--time">
          <span className="alarm-wizard-step-num">1</span>
          <h4>알람 시간</h4>
          <div className="alarm-wizard-step-body">
            <TimeWheelPicker
              hour12={draft.hour12}
              minute={draft.minute}
              meridiem={draft.meridiem}
              onChange={({ hour12, minute, meridiem }) => setDraft((d) => ({ ...d, hour12, minute, meridiem }))}
            />

            <div className="alarm-day-picker">
              {DAYS_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={[draft.daysOfWeek.includes(day) && 'active', day === 'sun' && 'is-sunday'].filter(Boolean).join(' ')}
                  onClick={() => toggleDay(day)}
                >
                  {DAY_OF_WEEK_LABELS[day]}
                </button>
              ))}
            </div>

            <label className="alarm-checkbox-row">
              <input type="checkbox" checked={draft.daysOfWeek.length > 0} disabled readOnly />
              <span>매주 울리기</span>
            </label>

            <div className="alarm-checkbox-row alarm-smartwake-row">
              <label className="alarm-checkbox-row-label">
                <input
                  type="checkbox"
                  checked={draft.smartWake}
                  onChange={(e) => setDraft((d) => ({ ...d, smartWake: e.target.checked, radarDeviceId: e.target.checked ? d.radarDeviceId : '' }))}
                />
                <span>기상 맞춤 알람</span>
                <InfoTooltip text="수면 단계를 추정해 설정된 시간에 맞춰 얕은 수면 단계에서 가장 개운하게 일어날 수 있도록 알람을 울립니다." />
              </label>

              {draft.smartWake && (
                <select
                  className="settings-select alarm-radar-select"
                  value={draft.radarDeviceId}
                  onChange={(e) => setDraft((d) => ({ ...d, radarDeviceId: e.target.value }))}
                >
                  <option value="">레이더 선택</option>
                  {radarDevices.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="alarm-wizard-step alarm-wizard-step--device">
          <span className="alarm-wizard-step-num">2</span>
          <h4>알람 장치</h4>
          <div className="alarm-wizard-step-body">
            <AlarmDevicePicker devices={devices} value={draft.deviceId} onChange={setDevice} />
          </div>
        </div>

        <div className="alarm-wizard-step alarm-wizard-step--method">
          <span className="alarm-wizard-step-num">3</span>
          <h4>알람 방법</h4>
          <div className="alarm-wizard-step-body">
            <AlarmMethodPanel
              device={selectedDevice}
              method={draft.method}
              onChange={(method) => setDraft((d) => ({ ...d, method }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
