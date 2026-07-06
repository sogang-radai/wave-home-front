import { useEffect, useRef, useState } from 'react';
import homeApi from '../../../api/homeApi';
import { PtzPad } from './PtzPad';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';
import { CameraShutterIcon } from '../icons';

function loadMuted(deviceId) {
  try {
    const raw = localStorage.getItem(`camera_muted_${deviceId}`);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

// reolink_e1_pro — PTZ (IPtzController) + stream (IVideoStreamProvider via
// go2rtc) are separate C++ interfaces from Actionable/Queryable, so this
// panel talks to dedicated homeApi.*Ptz/*Stream methods instead of the
// generic invokeDevice/queryDevice used by other classes.
export function CameraPanel({ device }) {
  const [streamStatus, setStreamStatus] = useState('idle');
  const [streamUrl, setStreamUrl] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [muted, setMuted] = useState(() => loadMuted(device.id));
  const [snapshots, setSnapshots] = useState([]);
  const canvasSeedRef = useRef(0);

  useEffect(() => {
    homeApi.getStreamInfo(device.id).then((info) => { setStreamStatus(info.status); setStreamUrl(info.url); });
    // A monitoring device's detail view should default to a live view rather
    // than sitting idle waiting for a "play" click.
    homeApi.setStreaming(device.id, true).then((info) => setStreamStatus(info.status));
  }, [device.id]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => homeApi.queryDevice(device.id, 'status').then((s) => { if (!cancelled) setMicLevel(s.micLevel ?? 0); });
    poll();
    const timer = setInterval(poll, 1500);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  const handleMove = (vector) => homeApi.movePtz(device.id, vector);
  const handleStop = () => homeApi.stopPtz(device.id);
  const handleZoomDelta = async (delta) => {
    const next = await homeApi.zoomPtz(device.id, delta);
    setZoom(next.zoom);
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem(`camera_muted_${device.id}`, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const capture = async () => {
    await homeApi.captureSnapshot(device.id);
    canvasSeedRef.current += 1;
    setSnapshots((list) => [{ id: `snap_${Date.now()}`, seed: canvasSeedRef.current, occurredAt: new Date().toISOString() }, ...list].slice(0, 6));
  };

  return (
    <div className="camera-panel">
      <div className="camera-video">
        {streamStatus === 'streaming' && streamUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video className="camera-video-el" src={streamUrl} autoPlay muted={muted} playsInline />
        ) : (
          <div className="camera-video-error">
            <strong>STREAM_UNAVAILABLE</strong>
            <span>go2rtc 스트림 연동 대기 중 — 백엔드 연결 시 실시간 영상이 표시됩니다.</span>
          </div>
        )}
        <button type="button" className="camera-capture-btn" onClick={capture} aria-label="스냅샷 캡처" title="스냅샷 캡처">
          <CameraShutterIcon width={20} height={20} />
        </button>
      </div>

      {snapshots.length > 0 && (
        <div className="snapshot-strip">
          {snapshots.map((snap) => (
            <div className="snapshot-thumb" key={snap.id} style={{ background: `hsl(${(snap.seed * 47) % 360}, 55%, 30%)` }}>
              <span>{new Date(snap.occurredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}

      <div className="camera-bottom-bar">
        <div className="camera-bottom-left">
          <TtsPanel deviceId={device.id} />
          <MicVolumeBar level={micLevel} muted={muted} onToggleMute={toggleMute} />
        </div>
        <div className="camera-bottom-right">
          <PtzPad onMove={handleMove} onStop={handleStop} onZoomDelta={handleZoomDelta} zoom={zoom} />
        </div>
      </div>
    </div>
  );
}
