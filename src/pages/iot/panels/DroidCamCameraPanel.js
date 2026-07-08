import { useEffect, useRef, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { DroidCamMjpegPlayer } from './DroidCamMjpegPlayer';
import { retainCameraStream, releaseCameraStream } from './cameraStreamSession';
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

// DroidCam only — MJPEG proxy; never touches go2rtc / fMP4.
export function DroidCamCameraPanel({ device }) {
  const [streamStatus, setStreamStatus] = useState('connecting');
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
      if (!cancelled) {
        setMicLevel(s.micLevel ?? 0);
        if (s.reachable === false)
          setStreamStatus('idle');
      }
    });
    poll();
    const timer = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [device.id]);

  useEffect(() => () => {
    snapshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    snapshotUrlsRef.current = [];
  }, []);

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
    releaseCameraStream(device.id);
  };

  return (
    <div className="camera-panel camera-panel--droid">
      <div className="camera-video">
        {(streamStatus === 'streaming' || streamStatus === 'connecting') ? (
          <>
            {streamStatus === 'connecting' && (
              <div className="camera-video-loading">
                <span>스트림 연결 중...</span>
              </div>
            )}
            <DroidCamMjpegPlayer
              deviceId={device.id}
              className="camera-video-el"
              onReady={() => setStreamStatus('streaming')}
              onError={handleStreamError}
            />
          </>
        ) : (
          <div className="camera-video-error">
            <strong>STREAM_UNAVAILABLE</strong>
            <span>DroidCam 앱이 실행 중인지, 같은 Wi-Fi에 연결되어 있는지 확인해주세요.</span>
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

      <div className="camera-bottom-bar camera-bottom-bar--volume-only">
        <MicVolumeBar level={micLevel} muted={muted} onToggleMute={toggleMute} />
      </div>
    </div>
  );
}
