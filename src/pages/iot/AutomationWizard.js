import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { IS_DEMO_MODE } from '../../api/config';
import iotApi from '../../api/iotApi';
import { deviceClassRegistry, getClassInfo, findAction } from '../../api/mock/deviceClassRegistry';
import { InfoTooltip } from '../alarm/InfoTooltip';
import { TimeWheelPicker, minutesToPickerState, pickerStateToMinutes } from '../alarm/TimeWheelPicker';
import '../alarm/alarm.css';
import {
  describeTrigger,
  describeSchedule,
  execModesFor,
  EXEC_MODE_LABELS,
  SCHEDULE_REPEAT_LABELS,
  DAY_OF_WEEK_LABELS,
  deviceThumbnails,
} from './iotUtils';
import { ParamsEditor, actionHasParams } from './RuleEditor';
import {
  TYPE_OPTIONS,
  DEVICE_STATE_OPS,
  SCHEDULE_REPEATS,
  DAYS_OF_WEEK,
  emptyDraft,
  draftFromRule,
  devicesWithTriggerKind,
  devicesWithActions,
  validateDraft,
  stepsFor,
  STEP_TITLES,
  isStepValid,
  suggestDraftName,
  timeStringToMinutes,
  minutesToTimeString,
} from './automationDraft';

const ALL_EXEC_MODES = Object.keys(EXEC_MODE_LABELS);
const EXEC_MODE_INFO = '한번: 조건이 맞을 때 딱 한 번 실행돼요.\nOn/Off 전환: 실행할 때마다 켜짐↔꺼짐이 번갈아 바뀌어요.\n연속 실행: 조건이 유지되는 동안 일정 간격으로 계속 실행돼요.';
const COOLDOWN_INFO = '같은 자동화가 다시 실행되기까지 최소한 기다려야 하는 시간이에요. 너무 자주 반복 실행되는 걸 막아줘요.';

const QUERY_LABELS = {
  power: '전력',
  voltage: '전압',
  current: '전류',
  lux: '조도',
  temperature: '온도',
  humidity: '습도',
  brightness: '밝기',
};

function DevicePickGrid({ devices, value, onChange, empty }) {
  if (devices.length === 0) {
    return <p className="panel-empty">{empty || '선택 가능한 장치가 없습니다.'}</p>;
  }
  return (
    <div className="automation-device-grid">
      {devices.map((d) => (
        <button
          key={d.id}
          type="button"
          className={`automation-device-tile${value === d.id ? ' selected' : ''}`}
          onClick={() => onChange(d.id)}
        >
          <span className="automation-device-tile-thumb" aria-hidden="true">
            {deviceThumbnails[d.class] ? (
              <img src={deviceThumbnails[d.class]} alt="" />
            ) : (
              <span>⌁</span>
            )}
          </span>
          <span className="automation-device-tile-name">{d.name}</span>
        </button>
      ))}
    </div>
  );
}

function PickerList({ items, getId, getLabel, value, onChange, empty }) {
  if (items.length === 0) {
    return <p className="panel-empty">{empty || '선택할 수 있는 항목이 없습니다.'}</p>;
  }
  return (
    <div className="trigger-picker-list trigger-scroll">
      {items.map((item) => {
        const id = getId(item);
        return (
          <button
            key={id}
            type="button"
            className={`trigger-picker-item${value === id ? ' selected' : ''}`}
            onClick={() => onChange(id)}
          >
            <span className="trigger-picker-item-label">{getLabel(item)}</span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryValue({ children }) {
  return <strong className="automation-wizard-summary-value">{children}</strong>;
}

function initialDraft(editingRule, initialMode) {
  if (editingRule) return draftFromRule(editingRule);
  const next = emptyDraft();
  if (initialMode === 'schedule') {
    return {
      ...next,
      mode: 'schedule',
      trigger: null,
      schedule: { repeat: 'once', delayMinutes: 30 },
    };
  }
  return next;
}

function initialStep(editingRule, initialMode, draft) {
  const all = stepsFor(draft);
  const steps = (initialMode === 'schedule' || editingRule || draft.mode === 'schedule')
    ? all.filter((s) => s !== 'type')
    : all;
  return steps[0] || 'type';
}

export function AutomationWizard({ devices, irCommands, editingRule, initialMode, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => initialDraft(editingRule, initialMode));
  const [stepId, setStepId] = useState(() => initialStep(editingRule, initialMode, initialDraft(editingRule, initialMode)));
  const [gestureClasses, setGestureClasses] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameTouched, setNameTouched] = useState(!!editingRule);

  const steps = useMemo(() => {
    const all = stepsFor(draft);
    // 예약 추가 진입 / 수정 시 type 단계는 숨긴다.
    if (initialMode === 'schedule' || editingRule || draft.mode === 'schedule') {
      return all.filter((s) => s !== 'type');
    }
    return all;
  }, [draft, initialMode, editingRule]);

  const stepIndex = Math.max(0, steps.indexOf(stepId));

  useEffect(() => {
    if (!steps.includes(stepId) && steps[0]) setStepId(steps[0]);
  }, [steps, stepId]);

  useEffect(() => {
    document.body.classList.add('automation-wizard-open');
    return () => document.body.classList.remove('automation-wizard-open');
  }, []);

  useEffect(() => {
    if (draft.trigger?.kind !== 'gesture' || !draft.trigger.gestureSetPath) {
      setGestureClasses([]);
      return;
    }
    const setId = draft.trigger.gestureSetPath.split('/')[1];
    if (!setId) { setGestureClasses([]); return; }
    iotApi.getGestureSetDefinition(setId).then((def) => {
      setGestureClasses(def.classes.filter((c) => c.kind === 'trigger'));
    }).catch(() => setGestureClasses([]));
  }, [draft.trigger?.kind, draft.trigger?.gestureSetPath]);

  const triggerDeviceOptions = useMemo(
    () => (draft.trigger?.kind ? devicesWithTriggerKind(devices, draft.trigger.kind) : []),
    [devices, draft.trigger?.kind],
  );
  const actionDeviceOptions = useMemo(() => devicesWithActions(devices), [devices]);
  const triggerDevice = devices.find((d) => d.id === draft.trigger?.deviceId);
  const actionDevice = devices.find((d) => d.id === draft.action.deviceId);
  const actionDef = actionDevice ? findAction(actionDevice.class, draft.action.name) : null;
  const allowedExecModes = actionDef ? execModesFor(actionDef) : ['once'];
  const gestureClassName = gestureClasses.find((c) => c.classId === draft.trigger?.classId)?.name;
  const irCommandName = irCommands.find((c) => c.id === draft.trigger?.commandId)?.name;
  const schedulePicker = minutesToPickerState(timeStringToMinutes(draft.schedule?.time || '09:00'));

  useEffect(() => {
    if (nameTouched) return;
    const actionLabel = actionDef?.description || draft.action.name;
    const suggested = suggestDraftName(draft, {
      triggerDeviceName: triggerDevice?.name,
      actionDeviceName: actionDevice?.name,
      actionLabel,
    });
    setDraft((d) => (suggested && suggested !== d.name ? { ...d, name: suggested } : d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.mode, draft.trigger, draft.schedule, draft.action.deviceId, draft.action.name, nameTouched]);

  const advanceFrom = (fromStep, nextDraft = draft) => {
    const nextSteps = (() => {
      const all = stepsFor(nextDraft);
      if (initialMode === 'schedule' || editingRule || nextDraft.mode === 'schedule') {
        return all.filter((s) => s !== 'type');
      }
      return all;
    })();
    const idx = nextSteps.indexOf(fromStep);
    if (idx >= 0 && idx < nextSteps.length - 1) setStepId(nextSteps[idx + 1]);
  };

  const setType = (opt) => {
    const nextDraft = opt.mode === 'schedule'
      ? { ...draft, mode: 'schedule', trigger: null, schedule: draft.schedule || { repeat: 'once', delayMinutes: 30 } }
      : {
        ...draft,
        mode: 'trigger',
        schedule: null,
        trigger: opt.kind === 'gesture'
          ? { kind: opt.kind, deviceId: '', gestureSetPath: '', classId: null }
          : opt.kind === 'device_state'
            ? { kind: opt.kind, deviceId: '', query: '', op: '>', value: 0 }
            : { kind: opt.kind, deviceId: '', commandId: '' },
      };
    setDraft(nextDraft);
    advanceFrom('type', nextDraft);
  };

  const setTriggerRadar = async (deviceId) => {
    const assignment = deviceId ? await iotApi.getRadarGestureSet(deviceId).catch(() => null) : null;
    const gestureSetPath = assignment?.gestureSetId ? `gestures/${assignment.gestureSetId}/set.json` : '';
    setDraft((d) => ({
      ...d,
      trigger: { ...d.trigger, deviceId, gestureSetPath, classId: null },
    }));
  };

  const setGestureClass = (classId) => {
    const nextDraft = {
      ...draft,
      trigger: { ...draft.trigger, classId },
    };
    setDraft(nextDraft);
    advanceFrom('gesture', nextDraft);
  };

  const setTriggerDevice = (deviceId) => {
    const nextDraft = { ...draft, trigger: { ...draft.trigger, deviceId } };
    setDraft(nextDraft);
    advanceFrom('device', nextDraft);
  };

  const setIrDevice = (deviceId) => {
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, deviceId, commandId: '' } }));
  };

  const setIrCommand = (commandId) => {
    const nextDraft = { ...draft, trigger: { ...draft.trigger, commandId } };
    setDraft(nextDraft);
    advanceFrom('irDetect', nextDraft);
  };

  const setSchedule = (patch) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, ...patch } }));
  const toggleScheduleDay = (day) => {
    const days = draft.schedule?.daysOfWeek || [];
    const next = days.includes(day) ? days.filter((x) => x !== day) : [...days, day];
    setSchedule({ daysOfWeek: next });
  };

  const setActionDevice = (deviceId) => {
    const nextDraft = { ...draft, action: { deviceId, name: '', params: {} } };
    setDraft(nextDraft);
    advanceFrom('actionDevice', nextDraft);
  };

  const setActionName = (name) => {
    const def = findAction(actionDevice?.class, name);
    const modes = def ? execModesFor(def) : ['once'];
    const nextDraft = {
      ...draft,
      action: { ...draft.action, name, params: {} },
      execMode: modes[0],
    };
    setDraft(nextDraft);
    if (!actionHasParams(def)) advanceFrom('action', nextDraft);
  };

  const canGoNext = isStepValid(draft, stepId);
  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex <= 0;

  const goBack = () => {
    if (isFirstStep) return;
    setStepId(steps[stepIndex - 1]);
  };
  const goNext = () => {
    if (!canGoNext || isLastStep) return;
    setStepId(steps[stepIndex + 1]);
  };
  const jumpTo = (target) => {
    const targetIndex = steps.indexOf(target);
    if (targetIndex < 0 || targetIndex > stepIndex) return;
    setStepId(target);
  };

  const save = async () => {
    const hint = validateDraft(draft);
    if (hint) { setSubmitError(hint); return; }
    setSubmitError('');
    setSaving(true);
    const payload = {
      name: draft.name,
      enabled: draft.enabled,
      trigger: draft.mode === 'trigger' ? draft.trigger : null,
      schedule: draft.mode === 'schedule' ? draft.schedule : null,
      action: draft.action,
      execMode: draft.execMode,
      repeatIntervalMs: draft.execMode === 'repeat' ? Number(draft.repeatIntervalMs) || 200 : undefined,
      cooldownMs: Number(draft.cooldownMs) || 0,
    };
    const kindLabelWithParticle = draft.mode === 'schedule' ? '예약을' : '자동화를';
    try {
      if (editingRule) {
        await iotApi.updateRule(editingRule.id, payload);
        onSaved(`${kindLabelWithParticle} 수정했습니다.`);
      } else if (IS_DEMO_MODE) {
        onSaved(`데모에서는 ${kindLabelWithParticle} 추가할 수 없습니다.`);
      } else {
        await iotApi.createRule(payload);
        onSaved(`${kindLabelWithParticle} 추가했습니다.`);
      }
    } catch (err) {
      setSubmitError(err.message || '저장에 실패했습니다.');
      setSaving(false);
    }
  };

  const handlePrimary = () => {
    if (isLastStep) save();
    else goNext();
  };

  const typeOptions = TYPE_OPTIONS;

  return (
    <div className="automation-wizard-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="automation-wizard-modal" role="dialog" aria-modal="true" aria-label={STEP_TITLES[stepId]}>
        <div className="automation-wizard-head">
          <div className="automation-wizard-progress">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`automation-wizard-dot${i === stepIndex ? ' active' : ''}${i < stepIndex ? ' done' : ''}`}
                onClick={() => jumpTo(s)}
                aria-label={STEP_TITLES[s]}
                disabled={i >= stepIndex}
              />
            ))}
          </div>
          <button type="button" className="automation-wizard-nav-btn" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="automation-wizard-body">
          <h3 className="automation-wizard-title">{STEP_TITLES[stepId]}</h3>

          {stepId === 'type' && (
            <div className="automation-option-list">
              {typeOptions.map((opt) => {
                const selected = draft.mode === opt.mode && draft.trigger?.kind === opt.kind;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className={`automation-option-item${selected ? ' selected' : ''}`}
                    onClick={() => setType(opt)}
                  >
                    <span className="automation-option-label">{opt.label}</span>
                    <span className="automation-option-desc">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          )}

          {stepId === 'gesture' && (
            <div className="automation-wizard-stack">
              <DevicePickGrid
                devices={triggerDeviceOptions}
                value={draft.trigger?.deviceId}
                onChange={setTriggerRadar}
                empty="제스처를 감지할 레이더가 없습니다."
              />
              <div className="automation-wizard-stack-block">
                <span className="device-panel-label">어떤 제스처를 사용할까요?</span>
                {!draft.trigger?.deviceId ? (
                  <p className="panel-empty">위에서 레이더를 먼저 선택하세요.</p>
                ) : !draft.trigger.gestureSetPath ? (
                  <p className="panel-empty automation-wizard-guide">
                    이 레이더에 제스처 셋이 할당되어 있지 않아요.<br />제어·관리 탭에서 레이더에 제스처 셋을 할당한 뒤 다시 돌아와 주세요.
                  </p>
                ) : (
                  <PickerList
                    items={gestureClasses}
                    getId={(c) => c.classId}
                    getLabel={(c) => c.name}
                    value={draft.trigger.classId}
                    onChange={setGestureClass}
                    empty="감지 가능한 제스처가 없습니다."
                  />
                )}
              </div>
            </div>
          )}

          {stepId === 'device' && (
            <DevicePickGrid
              devices={triggerDeviceOptions}
              value={draft.trigger?.deviceId}
              onChange={setTriggerDevice}
            />
          )}

          {stepId === 'detail' && draft.trigger?.kind === 'device_state' && (
            <>
              <div className="settings-field settings-field--grow">
                <span>측정값</span>
                <PickerList
                  items={getClassInfo(devices.find((d) => d.id === draft.trigger.deviceId)?.class).triggerableQueries || []}
                  getId={(q) => q}
                  getLabel={(q) => QUERY_LABELS[q] || q}
                  value={draft.trigger.query}
                  onChange={(query) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, query } }))}
                />
              </div>
              <div className="settings-field">
                <span>조건</span>
                <div className="trigger-op-picker">
                  {DEVICE_STATE_OPS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      className={draft.trigger.op === op ? 'active' : ''}
                      onClick={() => setDraft((d) => ({ ...d, trigger: { ...d.trigger, op } }))}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
              <label className="settings-field settings-field--row">
                <span>기준값</span>
                <input
                  type="number"
                  value={draft.trigger.value}
                  onChange={(e) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, value: Number(e.target.value) } }))}
                />
              </label>
            </>
          )}

          {stepId === 'irDetect' && (
            <div className="automation-wizard-stack">
              <DevicePickGrid
                devices={triggerDeviceOptions}
                value={draft.trigger?.deviceId}
                onChange={setIrDevice}
                empty="적외선 신호를 받을 Wave Station이 없습니다."
              />
              <div className="automation-wizard-stack-block">
                <span className="device-panel-label">어떤 적외선 명령을 감지할까요?</span>
                {!draft.trigger?.deviceId ? (
                  <p className="panel-empty">위에서 장치를 먼저 선택하세요.</p>
                ) : (
                  <PickerList
                    items={irCommands}
                    getId={(c) => c.id}
                    getLabel={(c) => c.name}
                    value={draft.trigger.commandId}
                    onChange={setIrCommand}
                    empty="등록된 적외선 명령이 없습니다."
                  />
                )}
              </div>
            </div>
          )}

          {stepId === 'schedule' && (
            <div className="automation-wizard-stack">
              <div className="rule-mode-toggle rule-mode-toggle--sm">
                {SCHEDULE_REPEATS.map((r) => (
                  <button key={r} type="button" className={draft.schedule?.repeat === r ? 'active' : ''} onClick={() => setSchedule({ repeat: r })}>
                    {SCHEDULE_REPEAT_LABELS[r]}
                  </button>
                ))}
              </div>

              {draft.schedule?.repeat === 'once' && (
                <p className="automation-inline-delay">
                  <span>지금부터</span>
                  <input
                    type="number"
                    min="1"
                    className="automation-inline-delay-input"
                    value={draft.schedule.delayMinutes ?? 30}
                    onChange={(e) => setSchedule({ delayMinutes: Number(e.target.value) })}
                    aria-label="분"
                  />
                  <span>분 후</span>
                </p>
              )}

              {(draft.schedule?.repeat === 'daily' || draft.schedule?.repeat === 'weekly') && (
                <div className="automation-schedule-time">
                  <TimeWheelPicker
                    hour12={schedulePicker.hour12}
                    minute={schedulePicker.minute}
                    meridiem={schedulePicker.meridiem}
                    onChange={(next) => setSchedule({ time: minutesToTimeString(pickerStateToMinutes(next)) })}
                  />
                </div>
              )}

              {draft.schedule?.repeat === 'weekly' && (
                <div className="rule-day-picker">
                  {DAYS_OF_WEEK.map((d) => (
                    <button key={d} type="button" className={(draft.schedule.daysOfWeek || []).includes(d) ? 'active' : ''} onClick={() => toggleScheduleDay(d)}>
                      {DAY_OF_WEEK_LABELS[d]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {stepId === 'actionDevice' && (
            <DevicePickGrid
              devices={actionDeviceOptions}
              value={draft.action.deviceId}
              onChange={setActionDevice}
            />
          )}

          {stepId === 'action' && (
            !actionDevice ? (
              <p className="panel-empty">이전 단계에서 가전을 먼저 선택하세요.</p>
            ) : (
              <div className="automation-wizard-stack">
                <PickerList
                  items={deviceClassRegistry[actionDevice.class]?.actions || []}
                  getId={(a) => a.name}
                  getLabel={(a) => a.description || a.name}
                  value={draft.action.name}
                  onChange={setActionName}
                />
                {actionDef && actionHasParams(actionDef) && (
                  <ParamsEditor
                    schema={actionDef.paramsSchema}
                    values={draft.action.params}
                    irCommands={irCommands}
                    onChange={(params) => setDraft((d) => ({ ...d, action: { ...d.action, params } }))}
                  />
                )}
              </div>
            )
          )}

          {stepId === 'execMode' && (
            <div className="automation-wizard-stack automation-wizard-exec">
              <span className="field-label-with-info automation-wizard-subhead">
                실행 방식
                <InfoTooltip text={EXEC_MODE_INFO} panel />
              </span>
              <div className="rule-mode-toggle rule-mode-toggle--sm">
                {ALL_EXEC_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={draft.execMode === m ? 'active' : ''}
                    disabled={!allowedExecModes.includes(m)}
                    onClick={() => setDraft((d) => ({ ...d, execMode: m }))}
                  >
                    {EXEC_MODE_LABELS[m]}
                  </button>
                ))}
              </div>
              {draft.execMode === 'repeat' && (
                <label className="settings-field settings-field--row">
                  <span>반복 (ms)</span>
                  <input type="number" min="50" value={draft.repeatIntervalMs} onChange={(e) => setDraft((d) => ({ ...d, repeatIntervalMs: Number(e.target.value) }))} />
                </label>
              )}
              <label className="settings-field settings-field--row">
                <span className="field-label-with-info">
                  쿨다운 (ms)
                  <InfoTooltip text={COOLDOWN_INFO} panel />
                </span>
                <input type="number" min="0" value={draft.cooldownMs} onChange={(e) => setDraft((d) => ({ ...d, cooldownMs: Number(e.target.value) }))} />
              </label>
            </div>
          )}

          {stepId === 'name' && (
            <>
              <label className="settings-field">
                <span>{draft.mode === 'schedule' ? '예약 이름' : '자동화 이름'}</span>
                <input
                  type="text"
                  autoFocus
                  value={draft.name}
                  onChange={(e) => { setNameTouched(true); setDraft((d) => ({ ...d, name: e.target.value })); }}
                  placeholder={draft.mode === 'schedule' ? '예약 이름' : '자동화 이름'}
                />
              </label>
              <div className="automation-wizard-summary">
                <div>
                  <span>조건</span>
                  <SummaryValue>
                    {draft.mode === 'schedule'
                      ? describeSchedule(draft.schedule)
                      : describeTrigger(draft.trigger, { deviceName: triggerDevice?.name, gestureClassName, commandName: irCommandName })}
                  </SummaryValue>
                </div>
                <div>
                  <span>동작</span>
                  <SummaryValue>{actionDevice?.name} · {actionDef?.description || draft.action.name}</SummaryValue>
                </div>
                <div>
                  <span>실행 방식</span>
                  <SummaryValue>{EXEC_MODE_LABELS[draft.execMode]}</SummaryValue>
                </div>
              </div>
            </>
          )}

          {submitError && <p className="automation-wizard-error">{submitError}</p>}
        </div>

        <div className="automation-wizard-footer">
          {!isFirstStep && (
            <button type="button" className="settings-btn-ghost automation-wizard-secondary" onClick={goBack}>
              이전
            </button>
          )}
          <button type="button" className="settings-btn-primary automation-wizard-primary" disabled={!canGoNext || saving} onClick={handlePrimary}>
            {isLastStep ? (editingRule ? '저장' : '완료') : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
