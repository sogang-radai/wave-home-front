import { useEffect, useRef } from 'react';
import { API_BASE_URL, USE_PLACEHOLDER_CAMERA_STREAM } from '../../../api/config';
import { MockCameraPlaceholder } from './MockCameraPlaceholder';

function getAccessToken() {
  return localStorage.getItem('wavehome_access_token');
}

const CODECS = [
  'video/mp4; codecs="avc1.640029,mp4a.40.2"',
  'video/mp4; codecs="avc1.640029, mp4a.40.2"',
  'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4; codecs="avc1.42E01E"',
  'video/mp4; codecs="avc1.640029"',
  'video/mp4',
];

// Plays go2rtc fMP4 through wave-server HTTP proxy (no WebRTC ICE needed).
export function CameraStreamPlayer({
  deviceId,
  muted,
  className,
  onMicLevel,
  onReady,
  onError,
  micAttachedRef,
}) {
  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    if (USE_PLACEHOLDER_CAMERA_STREAM)
      return undefined;

    let cancelled = false;
    let objectUrl = null;
    let mediaSource = null;
    const abort = new AbortController();

    const waitForBuffer = (sourceBuffer) => new Promise((resolve) => {
      if (!sourceBuffer.updating) {
        resolve();
        return;
      }
      sourceBuffer.addEventListener('updateend', resolve, { once: true });
    });

    const pump = async (reader, sourceBuffer, queue) => {
      let started = false;

      while (!cancelled) {
        if (!queue.length) {
          const { done, value } = await reader.read();
          if (done)
            break;
          queue.push(value);
        }

        if (sourceBuffer.updating) {
          await waitForBuffer(sourceBuffer);
          continue;
        }

        const chunk = queue.shift();
        if (!chunk?.length)
          continue;

        try {
          sourceBuffer.appendBuffer(chunk);
        } catch {
          onErrorRef.current?.();
          break;
        }

        await waitForBuffer(sourceBuffer);

        if (!started) {
          started = true;
          const video = videoRef.current;
          if (video) {
            video.play().then(() => onReadyRef.current?.()).catch(() => {});
          }
        }
      }
    };

    const start = async () => {
      const video = videoRef.current;
      if (!video || cancelled)
        return;

      mediaSource = new MediaSource();
      objectUrl = URL.createObjectURL(mediaSource);
      video.src = objectUrl;

      await new Promise((resolve) => {
        mediaSource.addEventListener('sourceopen', resolve, { once: true });
      });
      if (cancelled)
        return;

      let sourceBuffer = null;
      for (const codec of CODECS) {
        if (cancelled)
          return;
        try {
          sourceBuffer = mediaSource.addSourceBuffer(codec);
          sourceBuffer.mode = 'segments';
          break;
        } catch {
          // try next codec string
        }
      }
      if (!sourceBuffer) {
        onErrorRef.current?.();
        return;
      }

      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/iot/devices/${deviceId}/stream/mp4`, {
        signal: abort.signal,
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok || cancelled) {
        onErrorRef.current?.();
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onErrorRef.current?.();
        return;
      }

      const queue = [];
      await pump(reader, sourceBuffer, queue);
    };

    start().catch((err) => {
      if (err?.name !== 'AbortError')
        onErrorRef.current?.();
    });

    return () => {
      cancelled = true;
      abort.abort();
      if (objectUrl)
        URL.revokeObjectURL(objectUrl);
      if (mediaSource && mediaSource.readyState === 'open') {
        try {
          mediaSource.endOfStream();
        } catch {
          // ignore
        }
      }
    };
  }, [deviceId]);

  useEffect(() => {
    if (USE_PLACEHOLDER_CAMERA_STREAM)
      return undefined;

    const video = videoRef.current;
    if (!video || !onMicLevel)
      return undefined;

    let ctx = null;
    let timer = null;

    const attach = () => {
      if (micAttachedRef?.current)
        return;
      if (micAttachedRef)
        micAttachedRef.current = true;

      ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(video);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const bins = new Uint8Array(analyser.frequencyBinCount);
      timer = setInterval(() => {
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i += 1)
          sum += bins[i];
        onMicLevel(sum / bins.length / 255);
      }, 150);
    };

    if (video.readyState >= 2)
      attach();
    else
      video.addEventListener('loadeddata', attach, { once: true });

    return () => {
      video.removeEventListener('loadeddata', attach);
      if (timer)
        clearInterval(timer);
      if (ctx) {
        ctx.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (micAttachedRef)
        micAttachedRef.current = false;
    };
  }, [onMicLevel, micAttachedRef]);

  if (USE_PLACEHOLDER_CAMERA_STREAM) {
    return (
      <MockCameraPlaceholder
        className={className}
        alt="카메라 스트림"
        onReady={onReady}
      />
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video ref={videoRef} className={className} autoPlay muted={muted} playsInline />
  );
}
