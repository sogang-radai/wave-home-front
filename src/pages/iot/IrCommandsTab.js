import { Fragment, useEffect, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { SettingsModal, ConfirmDialog, GearIcon, TrashIcon } from '../settings/SettingsUI';
import { InfoTooltip } from '../alarm/InfoTooltip';
import iotApi from '../../api/iotApi';
import { parseTimingsText } from '../../data/irCommandData';
import '../alarm/alarm.css';

const LEARN_TIMEOUT_MS = 10000;

const TIMING_INFO =
  '타이밍은 리모컨 적외선 신호의 펄스 길이(마이크로초 단위) 목록이에요.\n'
  + '학습 버튼으로 Wave Station이 신호를 받아 자동으로 채우거나, 측정·제조사 값을 직접 입력할 수 있습니다.';

function emptyForm(waveStations) {
  return {
    id: null,
    name: '',
    description: '',
    deviceId: waveStations[0]?.id || '',
    timingsText: '',
  };
}

function autoGrowTextarea(el, minRows) {
  if (!el) return;
  const styles = window.getComputedStyle(el);
  const lineHeight = parseFloat(styles.lineHeight) || 20;
  const pad = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  const minHeight = lineHeight * minRows + pad;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
}

function IrCommandModal({ command, waveStations, onSave, onClose }) {
  const [form, setForm] = useState(() => (command
    ? {
      id: command.id,
      name: command.name,
      description: command.description || '',
      deviceId: waveStations[0]?.id || '',
      timingsText: command.timings.join(', '),
    }
    : emptyForm(waveStations)));
  const [error, setError] = useState('');
  const [learning, setLearning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef(null);
  const timingsRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => () => clearInterval(countdownTimer.current), []);

  useEffect(() => {
    autoGrowTextarea(timingsRef.current, 3);
    autoGrowTextarea(descriptionRef.current, 1);
  }, [form.timingsText, form.description]);

  const { timings, error: parseError } = parseTimingsText(form.timingsText);
  const canSave = !!form.name.trim() && !parseError && !!form.deviceId;

  const startLearn = () => {
    if (!form.deviceId) {
      setError('Wave Station 장치를 선택해주세요.');
      return;
    }
    setLearning(true);
    setError('');
    setCountdown(LEARN_TIMEOUT_MS / 1000);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    iotApi.startIrLearn({ deviceId: form.deviceId, timeoutMs: LEARN_TIMEOUT_MS })
      .then(({ timings: learned }) => {
        setForm((f) => ({ ...f, timingsText: learned.join(', '), source: 'learned' }));
      })
      .catch((err) => setError(err.message || '학습에 실패했습니다.'))
      .finally(() => {
        clearInterval(countdownTimer.current);
        setLearning(false);
      });
  };

  const submit = async () => {
    if (parseError) { setError(parseError); return; }
    try {
      await onSave({
        id: form.id,
        name: form.name,
        description: form.description,
        timings,
        source: form.id ? undefined : 'manual',
      });
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    }
  };

  return (
    <SettingsModal
      title={command ? '적외선 명령 수정' : '적외선 명령 추가'}
      onClose={onClose}
      footer={
        <Fragment>
          {(error || parseError) && <p className="settings-field-error">{error || parseError}</p>}
          <div className="settings-modal-footer-right">
            <button type="button" className="settings-btn-ghost" onClick={onClose}>취소</button>
            <button type="button" className="settings-btn-primary" onClick={submit} disabled={!canSave}>저장</button>
          </div>
        </Fragment>
      }
    >
      <label className="settings-field">
        <span>이름</span>
        <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 에어컨 전원" />
      </label>
      <label className="settings-field">
        <span>설명</span>
        <textarea
          ref={descriptionRef}
          className="ir-autogrow-textarea"
          rows={1}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="선택 사항"
        />
      </label>
      <label className="settings-field">
        <span>장치</span>
        <select
          className="settings-select"
          value={form.deviceId}
          onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value }))}
          disabled={learning || waveStations.length === 0}
        >
          {waveStations.length === 0 && <option value="">Wave Station 없음</option>}
          {waveStations.map((station) => (
            <option key={station.id} value={station.id}>{station.name}</option>
          ))}
        </select>
      </label>
      <label className="settings-field">
        <span className="ir-field-label-with-info">
          타이밍
          <InfoTooltip text={TIMING_INFO} />
        </span>
        <textarea
          ref={timingsRef}
          className="ir-autogrow-textarea"
          rows={3}
          value={form.timingsText}
          onChange={(e) => setForm((f) => ({ ...f, timingsText: e.target.value }))}
          placeholder="9000, 4500, 560, 560, ..."
        />
      </label>

      {learning ? (
        <div className="ir-learn-banner ir-learn-banner--single">
          이제 장치에 대고 리모컨을 눌러주세요 — {countdown}초 남음
        </div>
      ) : (
        <button type="button" className="settings-btn-ghost ir-learn-btn" onClick={startLearn} disabled={!form.deviceId}>학습</button>
      )}
    </SettingsModal>
  );
}

export function IrCommandsTab() {
  const [commands, setCommands] = useState([]);
  const [waveStations, setWaveStations] = useState([]);
  const [modalCommand, setModalCommand] = useState(undefined); // undefined = closed, null = new, object = edit
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => iotApi.getIrCommands().then(setCommands);

  useEffect(() => {
    load();
    iotApi.getDevices().then((devices) => {
      setWaveStations(devices.filter((d) => d.class === 'wave_station'));
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const save = async (payload) => {
    await iotApi.saveIrCommand(payload);
    setModalCommand(undefined);
    load();
    showToast('저장했습니다.');
  };

  const remove = async () => {
    await iotApi.deleteIrCommand(confirmDelete.id);
    setConfirmDelete(null);
    load();
    showToast('삭제했습니다.');
  };

  const testSend = async (command) => {
    await iotApi.testSendIr(command.id);
    showToast(`테스트 전송: ${command.name}`);
  };

  return (
    <Card title="적외선 명령" wide>
      <div className="ir-command-toolbar">
        <button type="button" className="settings-add-btn" onClick={() => setModalCommand(null)}>
          명령 추가
        </button>
      </div>
      <div className="ir-command-list">
        {commands.map((command) => (
          <article className="ir-command-row" key={command.id}>
            <div className="ir-command-main">
              <strong>{command.name}</strong>
              <span>{command.description}</span>
              <div className="ir-command-badges">
                <em className="attr-badge ir-attr-badge">{command.timings.length}개 타이밍</em>
                <em className="attr-badge ir-attr-badge">{command.source === 'learned' ? '학습됨' : '수동 입력'}</em>
              </div>
            </div>
            <div className="ir-command-actions">
              <button type="button" className="settings-btn-ghost" onClick={() => testSend(command)}>테스트</button>
              <button type="button" className="icon-btn" onClick={() => setModalCommand(command)} aria-label="수정" title="수정">
                <GearIcon width={16} height={16} />
              </button>
              <button type="button" className="icon-btn icon-btn-delete" onClick={() => setConfirmDelete(command)} aria-label="삭제" title="삭제">
                <TrashIcon width={16} height={16} />
              </button>
            </div>
          </article>
        ))}
        {commands.length === 0 && <p className="panel-empty">등록된 적외선 명령이 없습니다.</p>}
      </div>

      {modalCommand !== undefined && (
        <IrCommandModal
          command={modalCommand}
          waveStations={waveStations}
          onSave={save}
          onClose={() => setModalCommand(undefined)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog title="적외선 명령 삭제" message={`'${confirmDelete.name}' 명령을 삭제할까요?`} onConfirm={remove} onCancel={() => setConfirmDelete(null)} />
      )}
      {toast && <div className="iot-toast">{toast}</div>}
    </Card>
  );
}
