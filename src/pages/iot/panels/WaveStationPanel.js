import { useEffect, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';

const DASH = '—';
const POLL_MS = 1000;

function formatEnvValue(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return DASH;
  return digits > 0 ? value.toFixed(digits) : String(value);
}

function mapEnvPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const lux = raw.lux ?? null;
  const tempC = raw.tempC ?? raw.temperature_c ?? null;
  const humidity = raw.humidity ?? raw.humidity_percent ?? null;
  if (lux == null && tempC == null && humidity == null) return null;
  return { lux, tempC, humidity };
}

function mergeEnv(prev, raw) {
  const mapped = mapEnvPayload(raw);
  if (!mapped) return prev;
  return {
    lux: mapped.lux ?? prev?.lux ?? null,
    tempC: mapped.tempC ?? prev?.tempC ?? null,
    humidity: mapped.humidity ?? prev?.humidity ?? null,
  };
}

export function WaveStationPanel({ device }) {
  const [micLevel, setMicLevel] = useState(null);
  const [env, setEnv] = useState(null);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEnv(null);
    setMicLevel(null);
    setLive(false);
    setError('');

    const applyTelemetry = (payload) => {
      if (cancelled) return;
      setLive(true);
      setError('');
      if (payload?.micLevel !== undefined)
        setMicLevel(payload.micLevel ?? null);
      if (payload?.env != null)
        setEnv((prev) => mergeEnv(prev, payload.env));
    };

    const pollOnce = async () => {
      try {
        const [status, envRaw] = await Promise.all([
          iotApi.queryDevice(device.id, 'status').catch(() => null),
          iotApi.queryDevice(device.id, 'env').catch(() => null),
        ]);
        if (cancelled) return;
        const next = {};
        if (status)
          next.micLevel = status?.mic_level ?? status?.micLevel ?? null;
        if (envRaw)
          next.env = envRaw;
        if (Object.keys(next).length > 0)
          applyTelemetry(next);
      } catch (err) {
        if (!cancelled)
          setError(err?.message || '상태를 불러오지 못했습니다.');
      }
    };

    pollOnce();
    const timer = setInterval(pollOnce, POLL_MS);

    const abort = iotApi.subscribeWaveStationTelemetry(device.id, {
      onEvent: (payload) => applyTelemetry(payload),
      onError: () => {
        // Polling remains the fallback; avoid blanking the panel on SSE failures.
      },
      onComplete: () => {},
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      abort();
    };
  }, [device.id]);

  return (
    <div className="wave-station-panel">
      <div className="panel-section">
        <span className="device-panel-label">실시간 센서</span>
        {error && <p className="panel-empty panel-empty-inline">{error}</p>}
        <div className="plug-metrics-card wave-station-metrics-card">
          <div className="plug-metric">
            <span>조도</span>
            <strong>{formatEnvValue(env?.lux, 1)}<small>lux</small></strong>
          </div>
          <div className="plug-metric">
            <span>온도</span>
            <strong>{formatEnvValue(env?.tempC, 1)}<small>℃</small></strong>
          </div>
          <div className="plug-metric">
            <span>습도</span>
            <strong>{formatEnvValue(env?.humidity, 1)}<small>%</small></strong>
          </div>
        </div>
      </div>

      <div className="wave-station-controls">
        <TtsPanel deviceId={device.id} />
        <MicVolumeBar level={micLevel} unavailable={!live || micLevel == null} />
      </div>
    </div>
  );
}
