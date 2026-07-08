import { useEffect, useState } from 'react';
import settingsApi from '../../api/settingsApi';
import { methodGroupFor } from './alarmUtils';

function LightMethodPanel({ method, onChange }) {
  const kind = method?.type === 'light_blink' ? 'light_blink' : 'light_on';
  const brightness = method?.brightness ?? 80;
  const intervalSec = method?.type === 'light_blink' ? (method.intervalSec ?? 3) : 3;

  const setKind = (nextKind) => {
    if (nextKind === 'light_blink') onChange({ type: 'light_blink', brightness, intervalSec });
    else onChange({ type: 'light_on', brightness });
  };

  return (
    <div className="alarm-method-panel">
      <div className="alarm-method-buttons-row">
        <button type="button" className={kind === 'light_blink' ? 'active' : ''} onClick={() => setKind('light_blink')}>깜빡이기</button>
        <button type="button" className={kind === 'light_on' ? 'active' : ''} onClick={() => setKind('light_on')}>켜기</button>
      </div>

      <label className="alarm-slider-row">
        <span>밝기 <strong>{brightness}%</strong></span>
        <input
          type="range"
          className="settings-range-input"
          min={10}
          max={100}
          value={brightness}
          onChange={(e) => onChange({ ...method, brightness: Number(e.target.value) })}
        />
      </label>

      {kind === 'light_blink' && (
        <label className="alarm-slider-row">
          <span>깜빡이는 주기 <strong>{intervalSec}초</strong></span>
          <input
            type="range"
            className="settings-range-input"
            min={1}
            max={10}
            value={intervalSec}
            onChange={(e) => onChange({ ...method, intervalSec: Number(e.target.value) })}
          />
        </label>
      )}
    </div>
  );
}

function PlugMethodPanel({ method, onChange }) {
  const options = [
    { type: 'plug_toggle', label: '토글' },
    { type: 'plug_on', label: '켜기' },
    { type: 'plug_off', label: '끄기' },
  ];
  return (
    <div className="alarm-method-buttons-col">
      {options.map((opt) => (
        <button
          key={opt.type}
          type="button"
          className={method?.type === opt.type ? 'active' : ''}
          onClick={() => onChange({ type: opt.type })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TtsMethodPanel({ method, onChange }) {
  const [speakers, setSpeakers] = useState([]);

  useEffect(() => {
    settingsApi.getTtsSpeakers().then(setSpeakers);
  }, []);

  const patch = (fields) => onChange({ type: 'tts', speakerId: null, text: '', repeatCount: 3, intervalSec: 10, ...method, ...fields });

  return (
    <div className="alarm-tts-form">
      <label className="settings-field">
        <span>목소리</span>
        <select className="settings-select" value={method?.speakerId ?? ''} onChange={(e) => patch({ speakerId: Number(e.target.value) })}>
          <option value="">선택</option>
          {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="settings-field">
        <span>재생할 문구</span>
        <textarea
          rows={2}
          value={method?.text || ''}
          placeholder="예: 일어날 시간이에요."
          onChange={(e) => patch({ text: e.target.value })}
        />
      </label>
      <label className="settings-field">
        <span>반복 횟수 (최대 20회)</span>
        <input
          type="number"
          min={1}
          max={20}
          value={method?.repeatCount ?? 3}
          onChange={(e) => patch({ repeatCount: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })}
        />
      </label>
      <label className="settings-field">
        <span>반복 주기 (초, 최대 60초)</span>
        <input
          type="number"
          min={1}
          max={60}
          value={method?.intervalSec ?? 10}
          onChange={(e) => patch({ intervalSec: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })}
        />
      </label>
    </div>
  );
}

// Step 3 — options depend entirely on the class of the device selected in step 2.
export function AlarmMethodPanel({ device, method, onChange }) {
  if (!device) {
    return <p className="panel-empty">알람 장치를 먼저 선택하세요.</p>;
  }
  const group = methodGroupFor(device);
  if (group === 'light') return <LightMethodPanel method={method} onChange={onChange} />;
  if (group === 'plug') return <PlugMethodPanel method={method} onChange={onChange} />;
  if (group === 'tts') return <TtsMethodPanel method={method} onChange={onChange} />;
  return <p className="panel-empty">이 장치는 알람 방법을 지원하지 않습니다.</p>;
}
