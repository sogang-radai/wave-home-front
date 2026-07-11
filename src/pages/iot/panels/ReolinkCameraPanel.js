import { useCallback, useEffect, useRef, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { USE_PLACEHOLDER_CAMERA_STREAM } from '../../../api/config';
import { CameraPlayer } from './CameraPlayer';
import { retainCameraStream, releaseCameraStream } from './cameraStreamSession';
import { PtzPad } from './PtzPad';
import { TtsPanel } from './TtsPanel';
import { MicVolumeBar } from './MicVolumeBar';
import { CameraShutterIcon } from '../icons';
import { CameraPovView } from './CameraPovView';

const PTZ_YAW_SPEED = Math.PI / 2.4;
const PTZ_PITCH_SPEED = Math.PI / 3.2;
const PTZ_PITCH_MIN = -Math.PI / 4;
const PTZ_PITCH_MAX = Math.PI / 4;

function loadMuted(deviceId) {
  try {
    const raw = localStorage.getItem(`camera_muted_${deviceId}`);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

// reolink_e1_pro — go2rtc fMP4 stream + PTZ + TTS (demo/mock: inline 3D POV).
export function ReolinkCameraPanel({ device }) {
  const [streamStatus, setStreamStatus] = useState('connecting');
  const [ptz, setPtz] = useState({ yaw: 0, pitch: 0, zoom: 0 });
  const [micLevel, setMicLevel] = useState(0);
  const [muted, setMuted] = useState(() => loadMuted(device.id));
  const [snapshots, setSnapshots] = useState([]);
  const snapshotUrlsRef = useRef([]);
  const moveVectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const usePov = USE_PLACEHOLDER_CAMERA_STREAM;

  useEffect(() => {
    if (usePov) {
      setStreamStatus('streaming');
      return undefined;
    }

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
  }, [device.id, usePov]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => iotApi.queryDevice(device.id, 'status').then((s) => {
      if (!cancelled)
        setMicLevel(s.micLevel ?? 0);
    }).catch(() => {});
    poll();
    const timer = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  useEffect(() => () => {
    snapshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    snapshotUrlsRef.current = [];
  }, []);

  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tickPtz = useCallback((now) => {
    const vector = moveVectorRef.current;
    if (!vector) {
      rafRef.current = null;
      return;
    }

    const last = lastTickRef.current || now;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    lastTickRef.current = now;

    setPtz((current) => ({
      ...current,
      yaw: current.yaw - vector.pan * PTZ_YAW_SPEED * dt,
      pitch: Math.max(
        PTZ_PITCH_MIN,
        Math.min(PTZ_PITCH_MAX, current.pitch + vector.tilt * PTZ_PITCH_SPEED * dt),
      ),
    }));

    rafRef.current = requestAnimationFrame(tickPtz);
  }, []);

  const handleMove = (vector) => {
    moveVectorRef.current = vector;
    lastTickRef.current = 0;
    if (!rafRef.current)
      rafRef.current = requestAnimationFrame(tickPtz);
    iotApi.movePtz(device.id, vector).catch(() => {});
  };

  const handleStop = () => {
    moveVectorRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    iotApi.stopPtz(device.id).catch(() => {});
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
    if (!shot?.url) return;
    snapshotUrlsRef.current.push(shot.url);
    setSnapshots((list) => [
      { id: `snap_${Date.now()}`, url: shot.url, occurredAt: shot.occurredAt },
      ...list,
    ].slice(0, 6));
  };

  const handleStreamError = () => {
    setStreamStatus('idle');
    releaseCameraStream(device.id);
  };

  return (
    <div className="camera-panel">
      <div className="camera-video">
        {usePov ? (
          <CameraPovView ptz={ptz} />
        ) : (streamStatus === 'streaming' || streamStatus === 'connecting') ? (
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
          <PtzPad onMove={handleMove} onStop={handleStop} />
        </div>
      </div>
    </div>
  );
}
