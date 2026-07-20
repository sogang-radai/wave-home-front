import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import iotApi from '../../api/iotApi';
import { deviceClassRegistry, getClassInfo, findAction } from '../../api/mock/deviceClassRegistry';
import { InfoTooltip } from '../alarm/InfoTooltip';
import { ChevronLeftIcon } from './icons';
import {
  describeTrigger,
  describeSchedule,
  execModesFor,
  EXEC_MODE_LABELS,
  SCHEDULE_REPEAT_LABELS,
  DAY_OF_WEEK_LABELS,
  deviceThumbnails,
} from './iotUtils';
import { ParamsEditor } from './RuleEditor';
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
} from './automationDraft';

const ALL_EXEC_MODES = Object.keys(EXEC_MODE_LABELS);
const EXEC_MODE_INFO = '한번: 조건이 맞을 때 딱 한 번 실행돼요.\n토글: 실행할 때마다 켬↔끔이 번갈아 바뀌어요.\n연속 실행: 조건이 유지되는 동안 일정 간격으로 계속 실행돼요.';
const COOLDOWN_INFO = '같은 자동화가 다시 실행되기까지 최소한 기다려야 하는 시간이에요. 너무 자주 반복 실행되는 걸 막아줘요.';

function DevicePickList({ devices, value, onChange }) {
  if (devices.length === 0) {
    return <p className="panel-empty">선택 가능한 장치가 없습니다.</p>;
  }
  return (
    <div className="trigger-device-list trigger-scroll automation-wizard-device-list">
      {devices.map((d) => (
        <button
          key={d.id}
          type="button"
          className={`trigger-device-item${value === d.id ? ' selected' : ''}`}
          onClick={() => onChange(d.id)}
        >
          <span className="trigger-device-thumb" aria-hidden="true">
            {deviceThumbnails[d.class] ? (
              <img src={deviceThumbnails[d.class]} alt="" />
            ) : (
              <span className="trigger-device-thumb-fallback">⌁</span>
            )}
          </span>
          <span className="trigger-device-name">{d.name}</span>
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

// "새 자동화" 버튼 또는 목록 카드를 눌렀을 때 뜨는 전체 화면급 모달. 항상
// 한 화면에 질문 하나만 보여주고(Apple Home 스타일), 뒤로/다음으로만
// 이동한다 — 예전처럼 감지조건·세부조건·실행동작·실행방식을 한 번에 다
// 펼쳐두지 않는다.
export function AutomationWizard({ devices, irCommands, editingRule, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => (editingRule ? draftFromRule(editingRule) : emptyDraft()));
  const [stepId, setStepId] = useState('type');
  const [gestureClasses, setGestureClasses] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameTouched, setNameTouched] = useState(!!editingRule);

  const steps = stepsFor(draft);
  const stepIndex = Math.max(0, steps.indexOf(stepId));

  useEffect(() => {
    document.body.classList.add('automation-wizard-open');
    return () => document.body.classList.remove('automation-wizard-open');
  }, []);

  useEffect(() => {
    if (draft.trigger?.kind !== 'gesture' || !draft.trigger.gestureSetPath) { setGestureClasses([]); return; }
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

  // 이름을 아직 직접 건드리지 않았다면(=새로 만드는 중이고 자동 제안 이름을
  // 그대로 쓰고 있다면), 이전 단계에서 선택이 바뀔 때마다 제안 이름을 최신
  // 상태로 갱신해서 마지막 "이름" 단계에 미리 채워둔다.
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

  const setType = (opt) => {
    if (opt.mode === 'schedule') {
      setDraft((d) => ({ ...d, mode: 'schedule', trigger: null, schedule: d.schedule || { repeat: 'once', delayMinutes: 30 } }));
      return;
    }
    setDraft((d) => ({
      ...d,
      mode: 'trigger',
      schedule: null,
      trigger: opt.kind === 'gesture'
        ? { kind: opt.kind, deviceId: '', gestureSetPath: '', classId: null }
        : opt.kind === 'device_state'
          ? { kind: opt.kind, deviceId: '', query: '', op: '>', value: 0 }
          : { kind: opt.kind, deviceId: '', commandId: '' },
    }));
  };

  const setTriggerDevice = async (deviceId) => {
    if (draft.trigger?.kind === 'gesture') {
      const assignment = deviceId ? await iotApi.getRadarGestureSet(deviceId).catch(() => null) : null;
      const gestureSetPath = assignment?.gestureSetId ? `gestures/${assignment.gestureSetId}/set.json` : '';
      setDraft((d) => ({ ...d, trigger: { ...d.trigger, deviceId, gestureSetPath, classId: null } }));
      return;
    }
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, deviceId } }));
  };

  const setSchedule = (patch) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, ...patch } }));
  const toggleScheduleDay = (day) => {
    const days = draft.schedule?.daysOfWeek || [];
    const next = days.includes(day) ? days.filter((x) => x !== day) : [...days, day];
    setSchedule({ daysOfWeek: next });
  };

  const setActionDevice = (deviceId) => setDraft((d) => ({ ...d, action: { deviceId, name: '', params: {} } }));
  const setActionName = (name) => {
    const def = findAction(actionDevice?.class, name);
    const modes = def ? execModesFor(def) : ['once'];
    setDraft((d) => ({ ...d, action: { ...d.action, name, params: {} }, execMode: modes[0] }));
  };

  const canGoNext = isStepValid(draft, stepId);
  const isLastStep = stepIndex === steps.length - 1;

  const goBack = () => {
    if (stepIndex === 0) { onClose(); return; }
    setStepId(steps[stepIndex - 1]);
  };
  const goNext = () => {
    if (!canGoNext || stepIndex >= steps.length - 1) return;
    setStepId(steps[stepIndex + 1]);
  };
  const jumpTo = (target) => {
    const targetIndex = steps.indexOf(target);
    if (targetIndex < 0) return;
    const reachable = steps.slice(0, targetIndex).every((s) => isStepValid(draft, s));
    if (reachable) setStepId(target);
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
    // "자동 예약"은 받침(ㄱ)으로 끝나 "을", "자동 감지"는 모음으로 끝나 "를".
    const kindLabelWithParticle = draft.mode === 'schedule' ? '자동 예약을' : '자동 감지를';
    try {
      if (editingRule) {
        await iotApi.updateRule(editingRule.id, payload);
        onSaved(`${kindLabelWithParticle} 수정했습니다.`);
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

  return (
    <div className="automation-wizard-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="automation-wizard-modal" role="dialog" aria-modal="true" aria-label={STEP_TITLES[stepId]}>
        <div className="automation-wizard-head">
          <button type="button" className="automation-wizard-nav-btn" onClick={goBack} aria-label={stepIndex === 0 ? '닫기' : '이전'}>
            {stepIndex === 0 ? <X size={18} /> : <ChevronLeftIcon width={18} height={18} />}
          </button>
          <div className="automation-wizard-progress">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`automation-wizard-dot${i === stepIndex ? ' active' : ''}${i < stepIndex ? ' done' : ''}`}
                onClick={() => jumpTo(s)}
                aria-label={STEP_TITLES[s]}
                disabled={i === stepIndex}
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
              {TYPE_OPTIONS.map((opt) => {
                const selected = draft.mode === opt.mode && (opt.mode === 'schedule' || draft.trigger?.kind === opt.kind);
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

          {stepId === 'device' && (
            <DevicePickList devices={triggerDeviceOptions} value={draft.trigger?.deviceId} onChange={setTriggerDevice} />
          )}

          {stepId === 'detail' && draft.trigger?.kind === 'gesture' && (
            !draft.trigger.gestureSetPath ? (
              <p className="panel-empty">선택한 레이더에 제스처 셋이 없습니다.</p>
            ) : (
              <PickerList
                items={gestureClasses}
                getId={(c) => c.classId}
                getLabel={(c) => c.name}
                value={draft.trigger.classId}
                onChange={(classId) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, classId } }))}
                empty="감지 가능한 제스처 클래스가 없습니다."
              />
            )
          )}

          {stepId === 'detail' && draft.trigger?.kind === 'device_state' && (
            <>
              <div className="settings-field settings-field--grow">
                <span>측정값</span>
                <PickerList
                  items={getClassInfo(devices.find((d) => d.id === draft.trigger.deviceId)?.class).triggerableQueries || []}
                  getId={(q) => q}
                  getLabel={(q) => q}
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

          {stepId === 'detail' && draft.trigger?.kind === 'ir_recv' && (
            <PickerList
              items={irCommands}
              getId={(c) => c.id}
              getLabel={(c) => c.name}
              value={draft.trigger.commandId}
              onChange={(commandId) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, commandId } }))}
            />
          )}

          {stepId === 'schedule' && (
            <>
              <div className="rule-mode-toggle rule-mode-toggle--sm">
                {SCHEDULE_REPEATS.map((r) => (
                  <button key={r} type="button" className={draft.schedule?.repeat === r ? 'active' : ''} onClick={() => setSchedule({ repeat: r })}>
                    {SCHEDULE_REPEAT_LABELS[r]}
                  </button>
                ))}
              </div>
              {draft.schedule?.repeat === 'once' && (
                <label className="settings-field settings-field--row">
                  <span>지금부터 (분 후)</span>
                  <input type="number" min="1" value={draft.schedule.delayMinutes ?? 30} onChange={(e) => setSchedule({ delayMinutes: Number(e.target.value) })} />
                </label>
              )}
              {(draft.schedule?.repeat === 'daily' || draft.schedule?.repeat === 'weekly') && (
                <label className="settings-field settings-field--row">
                  <span>시각</span>
                  <input type="time" value={draft.schedule.time || '00:00'} onChange={(e) => setSchedule({ time: e.target.value })} />
                </label>
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
            </>
          )}

          {stepId === 'actionDevice' && (
            <DevicePickList devices={actionDeviceOptions} value={draft.action.deviceId} onChange={setActionDevice} />
          )}

          {stepId === 'action' && (
            !actionDevice ? (
              <p className="panel-empty">이전 단계에서 기기를 먼저 선택하세요.</p>
            ) : (
              <>
                <PickerList
                  items={deviceClassRegistry[actionDevice.class]?.actions || []}
                  getId={(a) => a.name}
                  getLabel={(a) => a.description || a.name}
                  value={draft.action.name}
                  onChange={setActionName}
                />
                {actionDef && (
                  <ParamsEditor
                    schema={actionDef.paramsSchema}
                    values={draft.action.params}
                    irCommands={irCommands}
                    onChange={(params) => setDraft((d) => ({ ...d, action: { ...d.action, params } }))}
                  />
                )}
              </>
            )
          )}

          {stepId === 'execMode' && (
            <>
              <span className="field-label-with-info automation-wizard-subhead">
                실행 방식
                <InfoTooltip text={EXEC_MODE_INFO} />
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
                  <InfoTooltip text={COOLDOWN_INFO} />
                </span>
                <input type="number" min="0" value={draft.cooldownMs} onChange={(e) => setDraft((d) => ({ ...d, cooldownMs: Number(e.target.value) }))} />
              </label>
            </>
          )}

          {stepId === 'name' && (
            <>
              <label className="settings-field">
                <span>자동화 이름</span>
                <input
                  type="text"
                  autoFocus
                  value={draft.name}
                  onChange={(e) => { setNameTouched(true); setDraft((d) => ({ ...d, name: e.target.value })); }}
                  placeholder="자동화 이름"
                />
              </label>
              <div className="automation-wizard-summary">
                <div>
                  <span>조건</span>
                  <strong>
                    {draft.mode === 'schedule'
                      ? describeSchedule(draft.schedule)
                      : describeTrigger(draft.trigger, { deviceName: triggerDevice?.name, gestureClassName, commandName: irCommandName })}
                  </strong>
                </div>
                <div>
                  <span>동작</span>
                  <strong>{actionDevice?.name} · {actionDef?.description || draft.action.name}</strong>
                </div>
                <div>
                  <span>실행 방식</span>
                  <strong>{EXEC_MODE_LABELS[draft.execMode]}</strong>
                </div>
              </div>
            </>
          )}

          {submitError && <p className="automation-wizard-error">{submitError}</p>}
        </div>

        <div className="automation-wizard-footer">
          <button type="button" className="settings-btn-primary automation-wizard-primary" disabled={!canGoNext || saving} onClick={handlePrimary}>
            {isLastStep ? (editingRule ? '저장' : '완료') : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
