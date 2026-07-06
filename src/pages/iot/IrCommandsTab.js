import { Fragment, useEffect, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { SettingsModal, ConfirmDialog, GearIcon, TrashIcon } from '../settings/SettingsUI';
import homeApi from '../../api/homeApi';
import { parseTimingsText } from '../../data/irCommandData';

const LEARN_TIMEOUT_MS = 10000;

function emptyForm() {
  return { id: null, name: '', description: '', timingsText: '' };
}

function IrCommandModal({ command, onSave, onClose }) {
  const [form, setForm] = useState(() => (command
    ? { id: command.id, name: command.name, description: command.description || '', timingsText: command.timings.join(', ') }
    : emptyForm()));
  const [error, setError] = useState('');
  const [learning, setLearning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef(null);

  useEffect(() => () => clearInterval(countdownTimer.current), []);

  const { timings, error: parseError } = parseTimingsText(form.timingsText);
  const canSave = !!form.name.trim() && !parseError;

  const startLearn = () => {
    setLearning(true);
    setError('');
    setCountdown(LEARN_TIMEOUT_MS / 1000);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    homeApi.startIrLearn({ timeoutMs: LEARN_TIMEOUT_MS })
      .then(({ timings: learned }) => {
        setForm((f) => ({ ...f, timingsText: learned.join(', ') }));
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
      await onSave({ id: form.id, name: form.name, description: form.description, timings, source: form.id ? undefined : 'manual' });
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    }
  };

  return (
    <SettingsModal
      title={command ? 'IR 커맨드 수정' : 'IR 커맨드 추가'}
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
        <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </label>

      <label className="settings-field">
        <span>타이밍</span>
        <textarea
          rows={4}
          value={form.timingsText}
          onChange={(e) => setForm((f) => ({ ...f, timingsText: e.target.value }))}
          placeholder="9000, 4500, 560, 560, ..."
        />
      </label>

      {learning ? (
        <div className="ir-learn-banner">
          <strong>이제 리모컨을 눌러주세요</strong>
          <p>{countdown}초 남음 — 신호를 기다리는 중…</p>
        </div>
      ) : (
        <button type="button" className="settings-btn-ghost ir-learn-btn" onClick={startLearn}>학습</button>
      )}
    </SettingsModal>
  );
}

export function IrCommandsTab() {
  const [commands, setCommands] = useState([]);
  const [modalCommand, setModalCommand] = useState(undefined); // undefined = closed, null = new, object = edit
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => homeApi.getIrCommands().then(setCommands);

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const save = async (payload) => {
    await homeApi.saveIrCommand(payload);
    setModalCommand(undefined);
    load();
    showToast('저장했습니다.');
  };

  const remove = async () => {
    await homeApi.deleteIrCommand(confirmDelete.id);
    setConfirmDelete(null);
    load();
    showToast('삭제했습니다.');
  };

  const testSend = async (command) => {
    await homeApi.testSendIr(command.id);
    showToast(`테스트 전송: ${command.name}`);
  };

  return (
    <Card
      title="IR 커맨드 목록"
      wide
      action={<button type="button" className="settings-add-btn" onClick={() => setModalCommand(null)}>+ 커맨드 추가</button>}
    >
      <div className="ir-command-list">
        {commands.map((command) => (
          <article className="ir-command-row" key={command.id}>
            <div className="ir-command-main">
              <strong>{command.name}</strong>
              <span>{command.description}</span>
              <div className="ir-command-badges">
                <em className="attr-badge">{command.timings.length}개 타이밍</em>
                <em className="attr-badge">{command.source === 'learned' ? '학습됨' : '수동 입력'}</em>
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
        {commands.length === 0 && <p className="panel-empty">등록된 IR 커맨드가 없습니다.</p>}
      </div>

      {modalCommand !== undefined && (
        <IrCommandModal command={modalCommand} onSave={save} onClose={() => setModalCommand(undefined)} />
      )}
      {confirmDelete && (
        <ConfirmDialog title="IR 커맨드 삭제" message={`'${confirmDelete.name}' 커맨드를 삭제할까요?`} onConfirm={remove} onCancel={() => setConfirmDelete(null)} />
      )}
      {toast && <div className="iot-toast">{toast}</div>}
    </Card>
  );
}
