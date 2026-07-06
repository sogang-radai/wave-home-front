import { useEffect, useState } from 'react';
import homeApi from '../../../api/homeApi';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';

export function WaveStationPanel({ device }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const poll = () => homeApi.queryDevice(device.id, 'status').then((s) => { if (!cancelled) setState(s); });
    poll();
    const timer = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  if (!state) return <p className="panel-loading">불러오는 중…</p>;

  return (
    <div className="wave-station-panel">
      <div className="wave-station-left">
        <TtsPanel deviceId={device.id} />
        <MicVolumeBar level={state.micLevel} />
      </div>
      <div className="wave-station-telemetry">
        <div className="telemetry-tile">
          <span>조도</span>
          <strong>{state.env.lux}<small>lux</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>온도</span>
          <strong>{state.env.tempC.toFixed(1)}<small>℃</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>습도</span>
          <strong>{state.env.humidity}<small>%</small></strong>
        </div>
      </div>
    </div>
  );
}
