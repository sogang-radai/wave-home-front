import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../api/config';

function getAccessToken() {
  return localStorage.getItem('wavehome_access_token');
}

function waitForIceGathering(pc, timeoutMs = 2500) {
  if (pc.iceGatheringState === 'complete')
    return Promise.resolve();

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

// WebRTC player that exchanges SDP with wave-server, which proxies to go2rtc.
export function Go2RtcPlayer({ deviceId, muted, className, onReady, onError }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const connect = async (attempt = 0) => {
      if (cancelled || attempt > 4)
        return;

      const pc = new RTCPeerConnection({
        iceServers: [],
      });
      pcRef.current = pc;

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().then(() => onReady?.()).catch(() => {});
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/iot/devices/${deviceId}/stream/webrtc`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp }),
      });

      if (!res.ok) {
        pc.close();
        if (!cancelled) {
          await new Promise((r) => { setTimeout(r, 400 * (attempt + 1)); });
          return connect(attempt + 1);
        }
        onError?.();
        return;
      }

      const answer = await res.json();
      if (cancelled) {
        pc.close();
        return;
      }

      await pc.setRemoteDescription({
        type: answer.type || 'answer',
        sdp: answer.sdp,
      });
    };

    connect().catch(() => {
      pcRef.current?.close();
      pcRef.current = null;
      onError?.();
    });

    return () => {
      cancelled = true;
      pcRef.current?.close();
      pcRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [deviceId, onError, onReady]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video ref={videoRef} className={className} autoPlay muted={muted} playsInline />
  );
}
