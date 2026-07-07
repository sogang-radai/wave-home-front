import { useEffect, useMemo, useState } from 'react';
import { SettingsModal } from '../settings/SettingsUI';
import { deviceClassRegistry, getClassInfo, findAction } from '../../api/mock/deviceClassRegistry';
import { execModesFor, EXEC_MODE_LABELS, SCHEDULE_REPEAT_LABELS, DAY_OF_WEEK_LABELS, TRIGGER_KIND_LABELS } from './iotUtils';
import iotApi from '../../api/iotApi';

const TRIGGER_KINDS = ['gesture', 'device_state', 'ir_recv'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function emptyRule(defaults = {}) {
  return {
    name: '',
    enabled: true,
    mode: defaults.trigger ? 'trigger' : defaults.schedule ? 'schedule' : 'trigger',
    trigger: defaults.trigger || null,
    schedule: defaults.schedule || null,
    action: defaults.action || { deviceId: '', name: '', params: {} },
    execMode: 'once',
    repeatIntervalMs: 200,
    cooldownMs: 1000,
  };
}

function devicesWithTriggerKind(devices, kind) {
  return devices.filter((d) => (getClassInfo(d.class).triggerKinds || []).includes(kind));
}

function devicesWithActions(devices) {
  return devices.filter((d) => (getClassInfo(d.class).actions || []).length > 0);
}

// Renders inputs for an action's paramsSchema (a small hand-rolled subset of
// JSON-schema: object/properties/integer/string/enum — enough for this demo).
// Exported so TriggerRulesTab's inline wizard can reuse the same renderer.
export function ParamsEditor({ schema, values, onChange, irCommands }) {
  if (!schema?.properties) return null;
  return (
    <div className="rule-params-grid">
      {Object.entries(schema.properties).map(([key, prop]) => {
        if (key === 'commandId') {
          return (
            <label className="settings-field" key={key}>
              <span>IR 커맨드</span>
              <select className="settings-select" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })}>
                <option value="">선택</option>
                {irCommands.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          );
        }
        if (prop.enum) {
          return (
            <label className="settings-field" key={key}>
              <span>{key}</span>
              <select className="settings-select" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })}>
                <option value="">선택</option>
                {prop.enum.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          );
        }
        if (prop.type === 'integer') {
          return (
            <label className="settings-field" key={key}>
              <span>{key}{prop.min !== undefined ? ` (${prop.min}~${prop.max})` : ''}</span>
              <input
                type="number"
                min={prop.min}
                max={prop.max}
                value={values[key] ?? ''}
                onChange={(e) => onChange({ ...values, [key]: Number(e.target.value) })}
              />
            </label>
          );
        }
        return (
          <label className="settings-field" key={key}>
            <span>{key}</span>
            <input type="text" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })} />
          </label>
        );
      })}
    </div>
  );
}

export function RuleEditor({ open, initialRule, defaults, devices, onSave, onCancel, onDelete }) {
  const [rule, setRule] = useState(() => (initialRule ? { ...initialRule, mode: initialRule.schedule ? 'schedule' : 'trigger' } : emptyRule(defaults)));
  const [error, setError] = useState('');
  const [irCommands, setIrCommands] = useState([]);
  const [gestureClasses, setGestureClasses] = useState([]);

  useEffect(() => {
    setRule(initialRule ? { ...initialRule, mode: initialRule.schedule ? 'schedule' : 'trigger' } : emptyRule(defaults));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRule, open]);

  useEffect(() => {
    iotApi.getIrCommands().then(setIrCommands);
  }, []);

  // Load trigger-kind gesture classes for the currently selected gesture-set path.
  useEffect(() => {
    if (rule.trigger?.kind !== 'gesture') { setGestureClasses([]); return; }
    const setId = rule.trigger.gestureSetPath?.split('/')[1];
    if (!setId) { setGestureClasses([]); return; }
    iotApi.getGestureSetDefinition(setId).then((def) => {
      setGestureClasses(def.classes.filter((c) => c.kind === 'trigger'));
    }).catch(() => setGestureClasses([]));
  }, [rule.trigger?.kind, rule.trigger?.gestureSetPath]);

  const actionDevice = devices.find((d) => d.id === rule.action.deviceId);
  const actionDef = actionDevice ? findAction(actionDevice.class, rule.action.name) : null;
  const allowedExecModes = actionDef ? execModesFor(actionDef) : ['once'];

  const triggerDeviceOptions = useMemo(
    () => (rule.trigger?.kind ? devicesWithTriggerKind(devices, rule.trigger.kind) : []),
    [devices, rule.trigger?.kind]
  );
  const actionDeviceOptions = useMemo(() => devicesWithActions(devices), [devices]);

  if (!open) return null;

  const setTriggerKind = (kind) => {
    if (!kind) { setRule((r) => ({ ...r, trigger: null })); return; }
    if (kind === 'gesture') setRule((r) => ({ ...r, trigger: { kind, deviceId: '', gestureSetPath: '', classId: null } }));
    if (kind === 'device_state') setRule((r) => ({ ...r, trigger: { kind, deviceId: '', query: '', op: '>', value: 0 } }));
    if (kind === 'ir_recv') setRule((r) => ({ ...r, trigger: { kind, deviceId: '', commandId: '' } }));
  };

  const setTriggerDevice = async (deviceId) => {
    if (rule.trigger?.kind === 'gesture') {
      const assignment = deviceId ? await iotApi.getRadarGestureSet(deviceId).catch(() => null) : null;
      const gestureSetPath = assignment?.gestureSetId ? `gestures/${assignment.gestureSetId}/set.json` : '';
      setRule((r) => ({ ...r, trigger: { ...r.trigger, deviceId, gestureSetPath, classId: null } }));
      return;
    }
    setRule((r) => ({ ...r, trigger: { ...r.trigger, deviceId } }));
  };

  const setSchedule = (patch) => setRule((r) => ({ ...r, schedule: { ...r.schedule, ...patch } }));

  const setActionDevice = (deviceId) => {
    setRule((r) => ({ ...r, action: { deviceId, name: '', params: {} } }));
  };

  const setActionName = (name) => {
    const def = findAction(actionDevice?.class, name);
    const modes = def ? execModesFor(def) : ['once'];
    setRule((r) => ({ ...r, action: { ...r.action, name, params: {} }, execMode: modes[0] }));
  };

  const toggleDay = (day) => {
    const days = rule.schedule?.daysOfWeek || [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    setSchedule({ daysOfWeek: next });
  };

  const submit = async () => {
    setError('');
    const payload = {
      name: rule.name,
      enabled: rule.enabled,
      trigger: rule.mode === 'trigger' ? rule.trigger : null,
      schedule: rule.mode === 'schedule' ? rule.schedule : null,
      action: rule.action,
      execMode: rule.execMode,
      repeatIntervalMs: rule.execMode === 'repeat' ? Number(rule.repeatIntervalMs) || 200 : undefined,
      cooldownMs: Number(rule.cooldownMs) || 0,
    };
    try {
      await onSave(payload, rule.id);
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    }
  };

  return (
    <SettingsModal
      title={rule.id ? '룰 수정' : '새 룰 추가'}
      onClose={onCancel}
      footer={
        <>
          {rule.id && onDelete && (
            <button type="button" className="settings-delete-link" onClick={() => onDelete(rule.id)}>삭제</button>
          )}
          <div className="settings-modal-footer-right">
            <button type="button" className="settings-btn-ghost" onClick={onCancel}>취소</button>
            <button type="button" className="settings-btn-primary" onClick={submit} disabled={!rule.name.trim()}>저장</button>
          </div>
        </>
      }
    >
      <label className="settings-field">
        <span>룰 이름</span>
        <input type="text" value={rule.name} onChange={(e) => setRule((r) => ({ ...r, name: e.target.value }))} placeholder="예: 책상 반짝 제스처로 조명 켜기" />
      </label>

      <div className="rule-mode-toggle">
        <button type="button" className={rule.mode === 'trigger' ? 'active' : ''} onClick={() => setRule((r) => ({ ...r, mode: 'trigger', schedule: null, trigger: r.trigger || {} }))}>트리거로 실행</button>
        <button type="button" className={rule.mode === 'schedule' ? 'active' : ''} onClick={() => setRule((r) => ({ ...r, mode: 'schedule', trigger: null, schedule: r.schedule || { repeat: 'once', delayMinutes: 30 } }))}>예약으로 실행</button>
      </div>

      {rule.mode === 'trigger' && (
        <div className="rule-section">
          <label className="settings-field">
            <span>트리거 종류</span>
            <select className="settings-select" value={rule.trigger?.kind || ''} onChange={(e) => setTriggerKind(e.target.value)}>
              <option value="">선택</option>
              {TRIGGER_KINDS.map((k) => <option key={k} value={k}>{TRIGGER_KIND_LABELS[k]}</option>)}
            </select>
          </label>

          {rule.trigger?.kind && (
            <label className="settings-field">
              <span>트리거 장치</span>
              <select className="settings-select" value={rule.trigger.deviceId} onChange={(e) => setTriggerDevice(e.target.value)}>
                <option value="">선택</option>
                {triggerDeviceOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}

          {rule.trigger?.kind === 'gesture' && rule.trigger.deviceId && (
            <label className="settings-field">
              <span>제스처 클래스 {!rule.trigger.gestureSetPath && '(할당된 제스처 셋 없음)'}</span>
              <select
                className="settings-select"
                value={rule.trigger.classId ?? ''}
                disabled={!rule.trigger.gestureSetPath}
                onChange={(e) => setRule((r) => ({ ...r, trigger: { ...r.trigger, classId: Number(e.target.value) } }))}
              >
                <option value="">선택</option>
                {gestureClasses.map((c) => <option key={c.classId} value={c.classId}>{c.name}</option>)}
              </select>
            </label>
          )}

          {rule.trigger?.kind === 'device_state' && rule.trigger.deviceId && (
            <div className="rule-inline-fields">
              <label className="settings-field">
                <span>측정값</span>
                <select className="settings-select" value={rule.trigger.query} onChange={(e) => setRule((r) => ({ ...r, trigger: { ...r.trigger, query: e.target.value } }))}>
                  <option value="">선택</option>
                  {(getClassInfo(devices.find((d) => d.id === rule.trigger.deviceId)?.class).triggerableQueries || []).map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </label>
              <label className="settings-field">
                <span>조건</span>
                <select className="settings-select" value={rule.trigger.op} onChange={(e) => setRule((r) => ({ ...r, trigger: { ...r.trigger, op: e.target.value } }))}>
                  {['>', '>=', '<', '<=', '=='].map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
              </label>
              <label className="settings-field">
                <span>기준값</span>
                <input type="number" value={rule.trigger.value} onChange={(e) => setRule((r) => ({ ...r, trigger: { ...r.trigger, value: Number(e.target.value) } }))} />
              </label>
            </div>
          )}

          {rule.trigger?.kind === 'ir_recv' && rule.trigger.deviceId && (
            <label className="settings-field">
              <span>수신 커맨드</span>
              <select className="settings-select" value={rule.trigger.commandId} onChange={(e) => setRule((r) => ({ ...r, trigger: { ...r.trigger, commandId: e.target.value } }))}>
                <option value="">선택</option>
                {irCommands.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {rule.mode === 'schedule' && rule.schedule && (
        <div className="rule-section">
          <div className="rule-mode-toggle rule-mode-toggle--sm">
            {['once', 'daily', 'weekly'].map((r) => (
              <button key={r} type="button" className={rule.schedule.repeat === r ? 'active' : ''} onClick={() => setSchedule({ repeat: r })}>
                {SCHEDULE_REPEAT_LABELS[r]}
              </button>
            ))}
          </div>
          {rule.schedule.repeat === 'once' && (
            <label className="settings-field">
              <span>지금부터 (분 후)</span>
              <input type="number" min="1" value={rule.schedule.delayMinutes ?? 30} onChange={(e) => setSchedule({ delayMinutes: Number(e.target.value) })} />
            </label>
          )}
          {(rule.schedule.repeat === 'daily' || rule.schedule.repeat === 'weekly') && (
            <label className="settings-field">
              <span>시각</span>
              <input type="time" value={rule.schedule.time || '00:00'} onChange={(e) => setSchedule({ time: e.target.value })} />
            </label>
          )}
          {rule.schedule.repeat === 'weekly' && (
            <div className="rule-day-picker">
              {DAYS.map((d) => (
                <button key={d} type="button" className={(rule.schedule.daysOfWeek || []).includes(d) ? 'active' : ''} onClick={() => toggleDay(d)}>
                  {DAY_OF_WEEK_LABELS[d]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rule-section">
        <h4 className="rule-section-title">실행할 동작</h4>
        <div className="rule-inline-fields">
          <label className="settings-field">
            <span>장치</span>
            <select className="settings-select" value={rule.action.deviceId} onChange={(e) => setActionDevice(e.target.value)}>
              <option value="">선택</option>
              {actionDeviceOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span>동작</span>
            <select className="settings-select" value={rule.action.name} disabled={!actionDevice} onChange={(e) => setActionName(e.target.value)}>
              <option value="">선택</option>
              {(actionDevice ? deviceClassRegistry[actionDevice.class]?.actions || [] : []).map((a) => (
                <option key={a.name} value={a.name}>{a.description || a.name}</option>
              ))}
            </select>
          </label>
        </div>
        {actionDef && (
          <ParamsEditor schema={actionDef.paramsSchema} values={rule.action.params} irCommands={irCommands} onChange={(params) => setRule((r) => ({ ...r, action: { ...r.action, params } }))} />
        )}
      </div>

      <div className="rule-section">
        <h4 className="rule-section-title">실행 방식</h4>
        <div className="rule-mode-toggle rule-mode-toggle--sm">
          {allowedExecModes.map((m) => (
            <button key={m} type="button" className={rule.execMode === m ? 'active' : ''} onClick={() => setRule((r) => ({ ...r, execMode: m }))}>
              {EXEC_MODE_LABELS[m]}
            </button>
          ))}
        </div>
        {rule.execMode === 'repeat' && (
          <label className="settings-field">
            <span>반복 주기 (ms)</span>
            <input type="number" min="50" value={rule.repeatIntervalMs} onChange={(e) => setRule((r) => ({ ...r, repeatIntervalMs: Number(e.target.value) }))} />
          </label>
        )}
        <label className="settings-field">
          <span>쿨다운 (ms) — 같은 룰이 다시 실행되기까지 최소 간격</span>
          <input type="number" min="0" value={rule.cooldownMs} onChange={(e) => setRule((r) => ({ ...r, cooldownMs: Number(e.target.value) }))} />
        </label>
      </div>

      {error && <p className="settings-field-error">{error}</p>}
    </SettingsModal>
  );
}
