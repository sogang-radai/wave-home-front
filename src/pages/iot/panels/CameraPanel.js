import { useEffect, useRef, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { CameraPlayer } from './CameraPlayer';
import { retainCameraStream, releaseCameraStream } from './cameraStreamSession';
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
// panel talks to dedicated iotApi.*Ptz/*Stream methods instead of the
// generic invokeDevice/queryDevice used by other classes.
export function CameraPanel({ device }) {
  const [streamStatus, setStreamStatus] = useState('connecting');
  const [zoom, setZoom] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [muted, setMuted] = useState(() => loadMuted(device.id));
  const [snapshots, setSnapshots] = useState([]);
  const snapshotUrlsRef = useRef([]);

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        const info = await retainCameraStream(device.id);
        if (active) {
          setStreamStatus(info.status === 'streaming' ? 'streaming' : 'connecting');
        }
      } catch {
        if (active) setStreamStatus('idle');
      }
    };

    start();

    return () => {
      active = false;
      releaseCameraStream(device.id);
    };
  }, [device.id]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => iotApi.queryDevice(device.id, 'status').then((s) => {
      if (!cancelled)
        setMicLevel(s.micLevel ?? 0);
    });
    poll();
    const timer = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  useEffect(() => () => {
    snapshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    snapshotUrlsRef.current = [];
  }, []);

  const handleMove = (vector) => { iotApi.movePtz(device.id, vector).catch(() => {}); };
  const handleStop = () => { iotApi.stopPtz(device.id).catch(() => {}); };
  const handleZoomDelta = async (delta) => {
    const next = await iotApi.zoomPtz(device.id, delta);
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
    const shot = await iotApi.captureSnapshot(device.id);
    snapshotUrlsRef.current.push(shot.url);
    setSnapshots((list) => [
      { id: `snap_${Date.now()}`, url: shot.url, occurredAt: shot.occurredAt },
      ...list,
    ].slice(0, 6));
  };

  const handleStreamError = () => {
    setStreamStatus('idle');
  };

  return (
    <div className="camera-panel">
      <div className="camera-video">
        {(streamStatus === 'streaming' || streamStatus === 'connecting') ? (
          <>
            {streamStatus === 'connecting' && (
              <div className="camera-video-loading">
                <span>스트림 연결 중...</span>
              </div>
            )}
            <CameraPlayer
              deviceId={device.id}
              muted={muted}
              className="camera-video-el"
              onMicLevel={setMicLevel}
              onReady={() => setStreamStatus('streaming')}
              onError={handleStreamError}
            />
          </>
        ) : (
          <div className="camera-video-error">
            <strong>STREAM_UNAVAILABLE</strong>
            <span>카메라에 연결할 수 없거나 스트림을 시작하지 못했습니다.</span>
          </div>
        )}
        <button type="button" className="camera-capture-btn" onClick={capture} aria-label="스냅샷 캡처" title="스냅샷 캡처">
          <CameraShutterIcon width={20} height={20} />
        </button>
      </div>

      {snapshots.length > 0 && (
        <div className="snapshot-strip">
          {snapshots.map((snap) => (
            <div className="snapshot-thumb" key={snap.id} style={{ backgroundImage: `url(${snap.url})` }}>
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
