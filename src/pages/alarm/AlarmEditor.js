import { useEffect, useState } from 'react';
import { PencilIcon } from '../iot/icons';
import { TimeWheelPicker } from './TimeWheelPicker';
import { AlarmDevicePicker } from './AlarmDevicePicker';
import { AlarmMethodPanel } from './AlarmMethodPanel';
import { InfoTooltip } from './InfoTooltip';
import {
  DAYS_ORDER, DAY_OF_WEEK_LABELS, todayDayKey, methodGroupFor, defaultMethodFor,
  formatClock12, timeMinuteFrom, validateAlarmDraft,
  WAVEHOME_DEVICE_ID, WAVEHOME_DEVICE, normalizeAlarmDeviceId, normalizeAlarmMethod,
  toApiAlarmDeviceId,
} from './alarmUtils';

function emptyDraft() {
  return {
    name: '',
    hour12: 7,
    minute: 0,
    meridiem: 'AM',
    daysOfWeek: [todayDayKey()],
    repeatWeekly: false,
    smartWake: false,
    radarDeviceId: '',
    deviceId: WAVEHOME_DEVICE_ID,
    method: defaultMethodFor('app_notify'),
    enabled: true,
  };
}

function draftFromAlarm(alarm) {
  const deviceId = normalizeAlarmDeviceId(alarm.deviceId);
  const days = Array.isArray(alarm.daysOfWeek) ? alarm.daysOfWeek : [];
  // Multi-day schedules are always weekly; a stale repeatWeekly:false from older
  // payloads would otherwise leave several day chips on with the checkbox off.
  const repeatWeekly = days.length > 1
    ? true
    : (typeof alarm.repeatWeekly === 'boolean' ? alarm.repeatWeekly : days.length > 0);
  return {
    name: alarm.name,
    ...formatClock12(alarm.timeMinute),
    daysOfWeek: days.length > 0 ? days : (repeatWeekly ? [] : [todayDayKey()]),
    repeatWeekly,
    smartWake: alarm.smartWake,
    radarDeviceId: alarm.radarDeviceId || '',
    deviceId,
    method: normalizeAlarmMethod(alarm.method, alarm.deviceId),
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

  const selectedDevice = draft.deviceId === WAVEHOME_DEVICE_ID
    ? WAVEHOME_DEVICE
    : (devices.find((d) => d.id === draft.deviceId) || null);

  const toggleDay = (day) => {
    if (!draft.repeatWeekly) {
      setDraft((d) => ({ ...d, daysOfWeek: [day] }));
      return;
    }
    const next = draft.daysOfWeek.includes(day)
      ? draft.daysOfWeek.filter((d) => d !== day)
      : [...draft.daysOfWeek, day];
    setDraft((d) => ({ ...d, daysOfWeek: next }));
  };

  const toggleRepeatWeekly = (checked) => {
    if (checked) {
      setDraft((d) => ({
        ...d,
        repeatWeekly: true,
        daysOfWeek: d.daysOfWeek.length > 0 ? d.daysOfWeek : [todayDayKey()],
      }));
      return;
    }
    setDraft((d) => ({
      ...d,
      repeatWeekly: false,
      daysOfWeek: d.daysOfWeek.length > 0 ? [d.daysOfWeek[0]] : [todayDayKey()],
    }));
  };

  const setDevice = (deviceId) => {
    const device = deviceId === WAVEHOME_DEVICE_ID
      ? WAVEHOME_DEVICE
      : (devices.find((d) => d.id === deviceId) || null);
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
      repeatWeekly: draft.repeatWeekly,
      smartWake: draft.smartWake,
      radarDeviceId: draft.smartWake ? draft.radarDeviceId || null : null,
      deviceId: toApiAlarmDeviceId(draft.deviceId),
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

            <div className="alarm-day-row">
              <div className="alarm-day-picker">
                {DAYS_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={[draft.daysOfWeek.includes(day) && 'active', day === 'sun' && 'is-sunday'].filter(Boolean).join(' ')}
                    onClick={() => toggleDay(day)}
                    aria-pressed={draft.daysOfWeek.includes(day)}
                  >
                    {DAY_OF_WEEK_LABELS[day]}
                  </button>
                ))}
              </div>
              <label className="alarm-repeat-checkbox">
                <input
                  type="checkbox"
                  checked={draft.repeatWeekly}
                  onChange={(e) => toggleRepeatWeekly(e.target.checked)}
                />
                매 주 반복
              </label>
            </div>

            <div className="alarm-smartwake-panel">
              <div className="alarm-smartwake-panel-head">
                <label className="alarm-checkbox-row-label">
                  <input
                    type="checkbox"
                    checked={draft.smartWake}
                    onChange={(e) => setDraft((d) => ({
                      ...d,
                      smartWake: e.target.checked,
                      radarDeviceId: e.target.checked ? d.radarDeviceId : '',
                    }))}
                  />
                  <span>기상 맞춤 알람</span>
                  <InfoTooltip
                    wide
                    panel
                    text={
                      '목표 시각 최대 30분 전부터 수면 단계(얕은 수면·REM·각성)를 보고 '
                      + '개운하게 일어날 수 있는 순간에 알람을 울립니다.\n\n'
                      + '해당 구간이 없으면 설정한 시각에 울립니다.\n\n'
                      + '수면 단계는 아직 휴리스틱으로 생성됩니다.'
                    }
                  />
                </label>
              </div>
              <p className="alarm-smartwake-hint">
                <strong>목표 시각 30분 전</strong>부터 얕은 수면·REM·각성 구간을 찾아 깨워 드려요.
                없으면 설정 시각에 울립니다.
              </p>
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
