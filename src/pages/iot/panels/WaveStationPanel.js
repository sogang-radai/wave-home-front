import { useEffect, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';

const DEFAULT_ENV = { lux: 0, tempC: 0, humidity: 0 };

async function loadWaveStationState(deviceId) {
  const status = await iotApi.queryDevice(deviceId, 'status');
  let env = DEFAULT_ENV;
  try {
    const envRaw = await iotApi.queryDevice(deviceId, 'env');
    env = {
      lux: envRaw.lux ?? envRaw.env?.lux ?? 0,
      tempC: envRaw.temperature_c ?? envRaw.tempC ?? envRaw.env?.tempC ?? 0,
      humidity: envRaw.humidity_percent ?? envRaw.humidity ?? envRaw.env?.humidity ?? 0,
    };
  } catch {
    // env query may be unavailable while subscriptions warm up
  }
  return {
    micLevel: status.micLevel ?? status.mic_level ?? 0,
    env,
  };
}

export function WaveStationPanel({ device }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await loadWaveStationState(device.id);
        if (!cancelled) {
          setState(next);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || '상태를 불러오지 못했습니다.');
      }
    };
    poll();
    const timer = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  if (!state && !error) return <p className="panel-loading">불러오는 중…</p>;
  if (!state) return <p className="panel-empty">{error}</p>;

  const env = state.env ?? DEFAULT_ENV;

  return (
    <div className="wave-station-panel">
      <div className="wave-station-left">
        <TtsPanel deviceId={device.id} />
        <MicVolumeBar level={state.micLevel ?? 0} />
      </div>
      <div className="wave-station-telemetry">
        <div className="telemetry-tile">
          <span>조도</span>
          <strong>{env.lux ?? 0}<small>lux</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>온도</span>
          <strong>{(env.tempC ?? 0).toFixed(1)}<small>℃</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>습도</span>
          <strong>{env.humidity ?? 0}<small>%</small></strong>
        </div>
      </div>
    </div>
  );
}
