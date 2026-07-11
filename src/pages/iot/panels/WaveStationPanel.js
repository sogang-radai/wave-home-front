import { useEffect, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';

const DASH = '—';

function formatEnvValue(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return DASH;
  return digits > 0 ? value.toFixed(digits) : String(value);
}

export function WaveStationPanel({ device }) {
  const [micLevel, setMicLevel] = useState(null);
  const [env, setEnv] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const abort = iotApi.subscribeWaveStationTelemetry(device.id, {
      onEvent: (payload) => {
        if (cancelled) return;
        setConnected(true);
        setError('');
        setMicLevel(payload?.micLevel ?? null);
        setEnv(payload?.env ?? null);
      },
      onError: (err) => {
        if (cancelled) return;
        setConnected(false);
        setMicLevel(null);
        setEnv(null);
        setError(err?.message || '상태를 불러오지 못했습니다.');
      },
      onComplete: () => {
        if (!cancelled) setConnected(false);
      },
    });

    return () => {
      cancelled = true;
      abort();
    };
  }, [device.id]);

  if (!connected && !error) return <p className="panel-loading">불러오는 중…</p>;

  return (
    <div className="wave-station-panel">
      <div className="wave-station-left">
        <TtsPanel deviceId={device.id} />
        <MicVolumeBar level={micLevel} unavailable={!connected || micLevel == null} />
      </div>
      <div className="wave-station-telemetry">
        {error && <p className="panel-empty panel-empty-inline">{error}</p>}
        <div className="telemetry-tile">
          <span>조도</span>
          <strong>{formatEnvValue(env?.lux, 1)}<small>lux</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>온도</span>
          <strong>{formatEnvValue(env?.tempC, 1)}<small>℃</small></strong>
        </div>
        <div className="telemetry-tile">
          <span>습도</span>
          <strong>{formatEnvValue(env?.humidity, 1)}<small>%</small></strong>
        </div>
      </div>
    </div>
  );
}
