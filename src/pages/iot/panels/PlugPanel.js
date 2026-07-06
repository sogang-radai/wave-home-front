import { useEffect, useState } from 'react';
import homeApi from '../../../api/homeApi';

// tuya_ep2h — on/off/toggle (Stateful/Toggle) + voltage/current/power/energy telemetry.
export function PlugPanel({ device, onChanged }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = () => homeApi.queryDevice(device.id, 'status').then((s) => { if (!cancelled) setState(s); });
    poll();
    const timer = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  const invoke = async (name) => {
    setBusy(true);
    try {
      const next = await homeApi.invokeDevice(device.id, name, {});
      setState(next);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  if (!state) return <p className="panel-loading">불러오는 중…</p>;

  return (
    <div className="plug-panel plug-panel--split">
      <div className="plug-panel-controls">
        <div className="plug-power-row">
          <button type="button" className={`toggle-switch toggle-switch--lg${state.switch ? ' on' : ''}`} disabled={busy} onClick={() => invoke('toggle')} aria-label="전원 토글">
            <i />
          </button>
          <span className="plug-power-label">{state.switch ? '켜짐' : '꺼짐'}</span>
        </div>
        <div className="plug-btn-row">
          <button type="button" disabled={busy} onClick={() => invoke('on')}>켜기</button>
          <button type="button" disabled={busy} onClick={() => invoke('off')}>끄기</button>
          <button type="button" disabled={busy} onClick={() => invoke('toggle')}>토글</button>
        </div>
      </div>

      <div className="plug-panel-sensors">
        <div className="plug-power-hero">
          <span>현재 전력</span>
          <strong>{(state.switch ? state.power : 0).toFixed(1)}<small>W</small></strong>
        </div>
        <div className="telemetry-grid">
          <div className="telemetry-tile">
            <span>전압</span>
            <strong>{state.voltage.toFixed(1)}<small>V</small></strong>
          </div>
          <div className="telemetry-tile">
            <span>전류</span>
            <strong>{state.current.toFixed(0)}<small>mA</small></strong>
          </div>
        </div>
      </div>
    </div>
  );
}
