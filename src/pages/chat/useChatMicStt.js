import { useCallback, useEffect, useRef, useState } from 'react';
import sttApi from '../../api/sttApi';

const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 1600; // ~100 ms at 16 kHz

function downsampleTo16k(input, inputRate) {
  if (!input?.length) return new Float32Array(0);
  if (inputRate === TARGET_RATE) return input;
  if (inputRate <= 0) return new Float32Array(0);

  const ratio = inputRate / TARGET_RATE;
  const outLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }
    output[i] = count > 0 ? sum / count : input[start] || 0;
  }
  return output;
}

/**
 * Browser mic → streaming STT session.
 * onPartial(text, { isEndpoint }) is called for live draft updates.
 */
export function useChatMicStt({ onPartial, onEndpoint, onError } = {}) {
  const [listening, setListening] = useState(false);
  const sessionRef = useRef(null);
  const abortEventsRef = useRef(null);
  const mediaRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const pendingRef = useRef(new Float32Array(0));
  const pushChainRef = useRef(Promise.resolve());
  const stoppingRef = useRef(false);
  const acceptEventsRef = useRef(false);
  const onPartialRef = useRef(onPartial);
  const onEndpointRef = useRef(onEndpoint);
  const onErrorRef = useRef(onError);

  useEffect(() => { onPartialRef.current = onPartial; }, [onPartial]);
  useEffect(() => { onEndpointRef.current = onEndpoint; }, [onEndpoint]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const cleanupCapture = useCallback(() => {
    try {
      processorRef.current?.disconnect();
    } catch { /* noop */ }
    processorRef.current = null;

    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    if (ctx) {
      try { ctx.close(); } catch { /* noop */ }
    }

    const stream = mediaRef.current;
    mediaRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    pendingRef.current = new Float32Array(0);
  }, []);

  const finishSession = useCallback(async ({ abort = false } = {}) => {
    // Stop applying STT text before teardown — end/flush can emit empty partials.
    acceptEventsRef.current = false;

    const sessionId = sessionRef.current;
    sessionRef.current = null;

    if (abortEventsRef.current) {
      abortEventsRef.current();
      abortEventsRef.current = null;
    }

    cleanupCapture();
    setListening(false);

    if (!sessionId) return;

    try {
      if (abort) await sttApi.abortSession(sessionId);
      else await sttApi.endSession(sessionId);
    } catch {
      // Session may already be gone.
    }
  }, [cleanupCapture]);

  const flushPending = useCallback((sessionId, force = false) => {
    const pending = pendingRef.current;
    if (!pending.length) return;
    if (!force && pending.length < CHUNK_SAMPLES) return;

    const chunk = pending.length > CHUNK_SAMPLES && !force
      ? pending.subarray(0, CHUNK_SAMPLES)
      : pending;
    const rest = pending.length > chunk.length
      ? pending.subarray(chunk.length)
      : new Float32Array(0);
    pendingRef.current = rest;

    const payload = new Float32Array(chunk);
    pushChainRef.current = pushChainRef.current
      .then(() => {
        if (sessionRef.current !== sessionId) return undefined;
        return sttApi.pushAudio(sessionId, payload);
      })
      .catch((err) => {
        onErrorRef.current?.(err);
      });
  }, []);

  const stop = useCallback(async ({ abort = false } = {}) => {
    if (stoppingRef.current && !abort) return;
    stoppingRef.current = true;

    const sessionId = sessionRef.current;
    if (sessionId) {
      flushPending(sessionId, true);
      try {
        await pushChainRef.current;
      } catch { /* noop */ }
    }

    await finishSession({ abort });
    stoppingRef.current = false;
  }, [finishSession, flushPending]);

  const start = useCallback(async () => {
    if (listening || stoppingRef.current) return;
    stoppingRef.current = false;

    let sessionId = null;
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        const err = new Error(
          window.isSecureContext
            ? '이 브라우저에서 마이크를 사용할 수 없습니다.'
            : '마이크는 localhost 또는 HTTPS에서만 사용할 수 있습니다. http://127.0.0.1:8510 으로 접속해 주세요.',
        );
        err.name = 'MediaDevicesUnavailable';
        err.code = 'MEDIA_DEVICES_UNAVAILABLE';
        throw err;
      }

      const created = await sttApi.createSession('ko-KR');
      sessionId = created?.sessionId;
      if (!sessionId) throw new Error('STT session missing');

      sessionRef.current = sessionId;
      pushChainRef.current = Promise.resolve();
      acceptEventsRef.current = true;

      abortEventsRef.current = sttApi.streamEvents(sessionId, {
        onEvent: (event) => {
          if (!acceptEventsRef.current) return;
          if (!event || event.type !== 'partial') return;
          const text = typeof event.text === 'string' ? event.text : '';
          const isEndpoint = Boolean(event.isEndpoint);
          // After endpoint the recognizer resets and often emits ""; ignore empties.
          if (!text.trim() && !isEndpoint) return;
          if (isEndpoint) acceptEventsRef.current = false;
          if (text.trim()) onPartialRef.current?.(text, { isEndpoint });
          if (isEndpoint) onEndpointRef.current?.(text);
        },
        onError: (err) => {
          if (!acceptEventsRef.current) return;
          onErrorRef.current?.(err);
          stop({ abort: true });
        },
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (sessionRef.current !== sessionId) return;
        const input = event.inputBuffer.getChannelData(0);
        const down = downsampleTo16k(input, audioCtx.sampleRate);
        if (!down.length) return;

        const merged = new Float32Array(pendingRef.current.length + down.length);
        merged.set(pendingRef.current, 0);
        merged.set(down, pendingRef.current.length);
        pendingRef.current = merged;

        while (pendingRef.current.length >= CHUNK_SAMPLES) {
          flushPending(sessionId, false);
        }
      };

      // Keep the processor in the audio graph without playing mic audio.
      const mute = audioCtx.createGain();
      mute.gain.value = 0;
      source.connect(processor);
      processor.connect(mute);
      mute.connect(audioCtx.destination);
      setListening(true);
    } catch (err) {
      await finishSession({ abort: true });
      onErrorRef.current?.(err);
      throw err;
    }
  }, [finishSession, flushPending, listening, stop]);

  useEffect(() => () => {
    stop({ abort: true });
  }, [stop]);

  return {
    listening,
    start,
    stop,
  };
}
