import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DragHandleIcon, TrashIcon } from '../settings/SettingsUI';
import { PencilIcon } from './icons';
import homeApi from '../../api/homeApi';
import { deviceClassRegistry, getClassInfo, findAction } from '../../api/mock/deviceClassRegistry';
import { describeTrigger, execModesFor, EXEC_MODE_LABELS, TRIGGER_KIND_LABELS, deviceThumbnails } from './iotUtils';
import { ParamsEditor } from './RuleEditor';

const TRIGGER_KINDS = ['gesture', 'device_state', 'ir_recv'];
const DEVICE_STATE_OPS = ['>', '>=', '<', '<=', '=='];
const ALL_EXEC_MODES = Object.keys(EXEC_MODE_LABELS);

function TriggerDevicePicker({ devices, value, onChange }) {
  if (devices.length === 0) {
    return <p className="panel-empty">선택 가능한 장치가 없습니다.</p>;
  }
  return (
    <div className="trigger-device-list trigger-scroll">
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

function emptyDraft() {
  return {
    name: '',
    enabled: true,
    trigger: null,
    action: { deviceId: '', name: '', params: {} },
    execMode: 'once',
    repeatIntervalMs: 200,
    cooldownMs: 1000,
  };
}

function draftFromRule(rule) {
  return {
    name: rule.name,
    enabled: rule.enabled,
    trigger: rule.trigger,
    action: rule.action,
    execMode: rule.execMode,
    repeatIntervalMs: rule.repeatIntervalMs ?? 200,
    cooldownMs: rule.cooldownMs ?? 0,
  };
}

function devicesWithTriggerKind(devices, kind) {
  return devices.filter((d) => (getClassInfo(d.class).triggerKinds || []).includes(kind));
}

function devicesWithActions(devices) {
  return devices.filter((d) => (getClassInfo(d.class).actions || []).length > 0);
}

function validateDraft(draft) {
  if (!draft.name.trim()) return '트리거 이름을 입력하세요.';
  if (!draft.trigger?.kind) return '트리거 조건 종류를 선택하세요.';
  if (!draft.trigger.deviceId) return '트리거 장치를 선택하세요.';
  if (draft.trigger.kind === 'gesture' && (draft.trigger.classId === null || draft.trigger.classId === undefined || draft.trigger.classId === '')) {
    return '제스처 클래스를 선택하세요.';
  }
  if (draft.trigger.kind === 'device_state' && !draft.trigger.query) return '측정값을 선택하세요.';
  if (draft.trigger.kind === 'ir_recv' && !draft.trigger.commandId) return '수신 커맨드를 선택하세요.';
  if (!draft.action.deviceId) return '실행할 장치를 선택하세요.';
  if (!draft.action.name) return '실행할 동작을 선택하세요.';
  return '';
}

function TriggerRuleRow({ rule, devices, dragging, selected, onDragStart, onDragOver, onDrop, onSelect, onToggle, onDelete, onExecute }) {
  const triggerDevice = devices.find((d) => d.id === rule.trigger?.deviceId);
  return (
    <article
      className={`trigger-rule-row${dragging ? ' dragging' : ''}${selected ? ' selected' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => onSelect(rule)}
    >
      <span className="trigger-rule-drag-handle" aria-hidden="true" title="순서 변경(임시)" onClick={(e) => e.stopPropagation()}>
        <DragHandleIcon width={15} height={15} />
      </span>
      <button
        type="button"
        className={`toggle-switch toggle-switch--sm${rule.enabled ? ' on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle(rule); }}
        aria-label="룰 활성화"
      >
        <i />
      </button>
      <div className="rule-row-body">
        <strong>{rule.name}</strong>
        <span>
          {describeTrigger(rule.trigger, { deviceName: triggerDevice?.name })}
          {' → '}{rule.actionDeviceName} · {rule.action.name} ({EXEC_MODE_LABELS[rule.execMode]})
        </span>
      </div>
      <div className="rule-row-actions">
        <button type="button" className="settings-btn-ghost" onClick={(e) => { e.stopPropagation(); onExecute(rule); }}>테스트</button>
        <button type="button" className="icon-btn icon-btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(rule); }} aria-label="삭제" title="삭제">
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    </article>
  );
}

export function TriggerRulesTab() {
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [order, setOrder] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [irCommands, setIrCommands] = useState([]);
  const [gestureClasses, setGestureClasses] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [submitError, setSubmitError] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [toast, setToast] = useState('');
  const rootRef = useRef(null);

  const load = () => homeApi.getRules().then((list) => setRules(list.filter((r) => !r.schedule)));

  useEffect(() => {
    homeApi.getDevices().then(setDevices);
    homeApi.getIrCommands().then(setIrCommands);
    load();
  }, []);

  useEffect(() => {
    setOrder((prev) => {
      const ids = rules.map((r) => r.id);
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [rules]);

  useEffect(() => {
    if (draft.trigger?.kind !== 'gesture' || !draft.trigger.gestureSetPath) { setGestureClasses([]); return; }
    const setId = draft.trigger.gestureSetPath.split('/')[1];
    if (!setId) { setGestureClasses([]); return; }
    homeApi.getGestureSetDefinition(setId).then((def) => {
      setGestureClasses(def.classes.filter((c) => c.kind === 'trigger'));
    }).catch(() => setGestureClasses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.trigger?.kind, draft.trigger?.gestureSetPath]);

  // Clicking outside the whole card (e.g. elsewhere on the page) deselects
  // the currently-selected trigger and returns the wizard to "add" mode.
  // Clicking the selected card again, or a different card, is handled
  // directly by selectRule below.
  useEffect(() => {
    if (!selectedRuleId) return undefined;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setSelectedRuleId(null);
        setDraft(emptyDraft());
        setSubmitError('');
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [selectedRuleId]);

  const orderedRules = useMemo(
    () => order.map((id) => rules.find((r) => r.id === id)).filter(Boolean),
    [order, rules]
  );

  const triggerDeviceOptions = useMemo(
    () => (draft.trigger?.kind ? devicesWithTriggerKind(devices, draft.trigger.kind) : []),
    [devices, draft.trigger?.kind]
  );
  const actionDeviceOptions = useMemo(() => devicesWithActions(devices), [devices]);
  const actionDevice = devices.find((d) => d.id === draft.action.deviceId);
  const actionDef = actionDevice ? findAction(actionDevice.class, draft.action.name) : null;
  const allowedExecModes = actionDef ? execModesFor(actionDef) : ['once'];
  const validationHint = validateDraft(draft);
  const canSave = !validationHint;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const setTriggerKind = (kind) => {
    if (!kind) { setDraft((d) => ({ ...d, trigger: null })); return; }
    if (kind === 'gesture') setDraft((d) => ({ ...d, trigger: { kind, deviceId: '', gestureSetPath: '', classId: null } }));
    if (kind === 'device_state') setDraft((d) => ({ ...d, trigger: { kind, deviceId: '', query: '', op: '>', value: 0 } }));
    if (kind === 'ir_recv') setDraft((d) => ({ ...d, trigger: { kind, deviceId: '', commandId: '' } }));
  };

  const setTriggerDevice = async (deviceId) => {
    if (draft.trigger?.kind === 'gesture') {
      const assignment = deviceId ? await homeApi.getRadarGestureSet(deviceId).catch(() => null) : null;
      const gestureSetPath = assignment?.gestureSetId ? `gestures/${assignment.gestureSetId}/set.json` : '';
      setDraft((d) => ({ ...d, trigger: { ...d.trigger, deviceId, gestureSetPath, classId: null } }));
      return;
    }
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, deviceId } }));
  };

  const setActionDevice = (deviceId) => setDraft((d) => ({ ...d, action: { deviceId, name: '', params: {} } }));

  const setActionName = (name) => {
    const def = findAction(actionDevice?.class, name);
    const modes = def ? execModesFor(def) : ['once'];
    setDraft((d) => ({ ...d, action: { ...d.action, name, params: {} }, execMode: modes[0] }));
  };

  const resetToAddMode = () => {
    setSelectedRuleId(null);
    setDraft(emptyDraft());
    setSubmitError('');
  };

  const selectRule = (rule) => {
    if (selectedRuleId === rule.id) {
      resetToAddMode();
      return;
    }
    setSelectedRuleId(rule.id);
    setDraft(draftFromRule(rule));
    setSubmitError('');
  };

  const saveDraft = async () => {
    const hint = validateDraft(draft);
    if (hint) {
      setSubmitError(hint);
      return;
    }
    setSubmitError('');
    const payload = {
      name: draft.name,
      enabled: draft.enabled,
      trigger: draft.trigger,
      schedule: null,
      action: draft.action,
      execMode: draft.execMode,
      repeatIntervalMs: draft.execMode === 'repeat' ? Number(draft.repeatIntervalMs) || 200 : undefined,
      cooldownMs: Number(draft.cooldownMs) || 0,
    };
    try {
      if (selectedRuleId) {
        await homeApi.updateRule(selectedRuleId, payload);
        showToast('트리거를 수정했습니다.');
      } else {
        await homeApi.createRule(payload);
        showToast('트리거를 추가했습니다.');
      }
      resetToAddMode();
      load();
    } catch (err) {
      setSubmitError(err.message || '저장에 실패했습니다.');
    }
  };

  const toggleRule = async (rule) => {
    await homeApi.setRuleEnabled(rule.id, !rule.enabled);
    load();
  };

  const deleteRule = async (rule) => {
    await homeApi.deleteRule(rule.id);
    if (selectedRuleId === rule.id) resetToAddMode();
    load();
    showToast('트리거를 삭제했습니다.');
  };

  const executeRule = async (rule) => {
    const result = await homeApi.executeRuleManually(rule.id);
    showToast(result.skipped ? `쿨다운 중입니다 (${Math.ceil(result.remainingMs / 100) / 10}초 남음)` : '트리거를 실행했습니다.');
  };

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  };

  return (
    <Card title="트리거" wide>
      <p className="section-description">기기 상태 변화·제스처·IR 수신을 감지해 다른 기기를 자동으로 제어하는 트리거를 관리합니다.</p>

      <div className="trigger-wizard-root" ref={rootRef}>
        <div className="trigger-wizard-header">
          <label className="settings-field">
            <span>트리거 이름</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => { setDraft((d) => ({ ...d, name: e.target.value })); setSubmitError(''); }}
              placeholder="예: 책상 반짝 제스처로 조명 켜기"
            />
          </label>
          <button type="button" className="settings-btn-primary trigger-wizard-add-btn" disabled={!canSave} onClick={saveDraft}>
            {selectedRuleId ? (<><PencilIcon width={14} height={14} /> 수정</>) : '+ 추가'}
          </button>
          {(submitError || (!canSave && draft.name.trim() && validationHint)) && (
            <p className="trigger-wizard-header-error">{submitError || validationHint}</p>
          )}
        </div>

        <div className="trigger-wizard">
          <div className="trigger-wizard-step">
            <span className="trigger-wizard-step-num">1</span>
            <h4>트리거 조건</h4>
            <div className="trigger-wizard-step-body">
              <label className="settings-field settings-field--row">
                <span>종류</span>
                <select className="settings-select" value={draft.trigger?.kind || ''} onChange={(e) => setTriggerKind(e.target.value)}>
                  <option value="">선택</option>
                  {TRIGGER_KINDS.map((k) => <option key={k} value={k}>{TRIGGER_KIND_LABELS[k]}</option>)}
                </select>
              </label>

              {draft.trigger?.kind && (
                <div className="settings-field settings-field--grow">
                  <span>장치</span>
                  <TriggerDevicePicker
                    devices={triggerDeviceOptions}
                    value={draft.trigger.deviceId}
                    onChange={(deviceId) => setTriggerDevice(deviceId)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="trigger-wizard-step trigger-wizard-step--detail">
            <span className="trigger-wizard-step-num">2</span>
            <h4>세부 조건</h4>
            <div className="trigger-wizard-step-body">
              {!draft.trigger?.kind && <p className="panel-empty">트리거 조건을 먼저 선택하세요.</p>}
              {draft.trigger?.kind && !draft.trigger.deviceId && <p className="panel-empty">트리거 장치를 먼저 선택하세요.</p>}

              {draft.trigger?.kind === 'gesture' && draft.trigger.deviceId && (
                <div className="settings-field settings-field--grow">
                  <span>제스처 클래스{!draft.trigger.gestureSetPath && ' (할당된 셋 없음)'}</span>
                  {!draft.trigger.gestureSetPath ? (
                    <p className="panel-empty" style={{ margin: '6px 0 0' }}>선택한 레이더에 제스처 셋이 없습니다.</p>
                  ) : (
                    <div className="trigger-picker-list trigger-picker-list--grow trigger-scroll">
                      {gestureClasses.map((c) => (
                        <button
                          key={c.classId}
                          type="button"
                          className={`trigger-picker-item${draft.trigger.classId === c.classId ? ' selected' : ''}`}
                          onClick={() => setDraft((d) => ({ ...d, trigger: { ...d.trigger, classId: c.classId } }))}
                        >
                          {c.name}
                        </button>
                      ))}
                      {gestureClasses.length === 0 && <p className="panel-empty">트리거 클래스가 없습니다.</p>}
                    </div>
                  )}
                </div>
              )}

              {draft.trigger?.kind === 'device_state' && draft.trigger.deviceId && (
                <>
                  <div className="settings-field settings-field--grow">
                    <span>측정값</span>
                    <div className="trigger-picker-list trigger-picker-list--grow trigger-scroll">
                      {(getClassInfo(devices.find((d) => d.id === draft.trigger.deviceId)?.class).triggerableQueries || []).map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={`trigger-picker-item${draft.trigger.query === q ? ' selected' : ''}`}
                          onClick={() => setDraft((d) => ({ ...d, trigger: { ...d.trigger, query: q } }))}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
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
                    <input type="number" value={draft.trigger.value} onChange={(e) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, value: Number(e.target.value) } }))} />
                  </label>
                </>
              )}

              {draft.trigger?.kind === 'ir_recv' && draft.trigger.deviceId && (
                <div className="settings-field settings-field--grow">
                  <span>수신 커맨드</span>
                  <div className="trigger-picker-list trigger-picker-list--grow trigger-scroll">
                    {irCommands.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`trigger-picker-item${draft.trigger.commandId === c.id ? ' selected' : ''}`}
                        onClick={() => setDraft((d) => ({ ...d, trigger: { ...d.trigger, commandId: c.id } }))}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="trigger-wizard-step trigger-wizard-step--action">
            <span className="trigger-wizard-step-num">3</span>
            <h4>실행할 동작</h4>
            <div className="trigger-wizard-step-body">
              <label className="settings-field settings-field--row">
                <span>장치</span>
                <select className="settings-select" value={draft.action.deviceId} onChange={(e) => setActionDevice(e.target.value)}>
                  <option value="">선택</option>
                  {actionDeviceOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <div className="settings-field settings-field--grow">
                <span>동작</span>
                {!actionDevice ? (
                  <p className="panel-empty">실행할 장치를 먼저 선택하세요.</p>
                ) : (
                  <div className="trigger-picker-list trigger-picker-list--plain">
                    {(deviceClassRegistry[actionDevice.class]?.actions || []).map((a) => (
                      <button
                        key={a.name}
                        type="button"
                        className={`trigger-picker-item${draft.action.name === a.name ? ' selected' : ''}`}
                        onClick={() => setActionName(a.name)}
                      >
                        {a.description || a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {actionDef && (
                <ParamsEditor schema={actionDef.paramsSchema} values={draft.action.params} irCommands={irCommands} onChange={(params) => setDraft((d) => ({ ...d, action: { ...d.action, params } }))} />
              )}
            </div>
          </div>

          <div className="trigger-wizard-step">
            <span className="trigger-wizard-step-num">4</span>
            <h4>실행 방식</h4>
            <div className="trigger-wizard-step-body">
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
                <span>쿨다운 (ms)</span>
                <input type="number" min="0" value={draft.cooldownMs} onChange={(e) => setDraft((d) => ({ ...d, cooldownMs: Number(e.target.value) }))} />
              </label>
            </div>
          </div>
        </div>

        <div className="rule-list trigger-rule-list">
          <div className="rule-list-head">
            <span>{orderedRules.length}개 트리거</span>
          </div>
          {orderedRules.length === 0 && <p className="panel-empty">등록된 트리거가 없습니다.</p>}
          {orderedRules.map((rule) => (
            <TriggerRuleRow
              key={rule.id}
              rule={rule}
              devices={devices}
              dragging={dragId === rule.id}
              selected={selectedRuleId === rule.id}
              onDragStart={() => setDragId(rule.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(rule.id)}
              onSelect={selectRule}
              onToggle={toggleRule}
              onDelete={deleteRule}
              onExecute={executeRule}
            />
          ))}
        </div>
      </div>

      {toast && <div className="iot-toast">{toast}</div>}
    </Card>
  );
}
