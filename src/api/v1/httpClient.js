import { API_BASE_URL, IS_DEMO_MODE } from '../config';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const DEMO_RUNTIME_STORAGE_KEY = 'wavehome_demo_rid';
const DEMO_RUNTIME_HEADER = 'X-Wave-Demo-Runtime-Id';

function getAccessToken() {
  return localStorage.getItem('wavehome_access_token');
}

function getDemoRuntimeId() {
  if (!IS_DEMO_MODE || typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(DEMO_RUNTIME_STORAGE_KEY);
    if (stored && stored.length >= 8) return stored;
  } catch {
    // ignore storage failures
  }
  // Mint client-side so chat/IoT/agent share one session before the first response.
  const minted =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `demo${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
  rememberDemoRuntimeId(minted);
  return minted;
}

function rememberDemoRuntimeId(runtimeId) {
  if (!IS_DEMO_MODE || !runtimeId || runtimeId.length < 8 || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_RUNTIME_STORAGE_KEY, runtimeId);
  } catch {
    // ignore storage failures
  }
}

function captureDemoRuntimeId(res) {
  const fromHeader = res.headers.get(DEMO_RUNTIME_HEADER);
  if (fromHeader) rememberDemoRuntimeId(fromHeader);
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
  }

  const token = getAccessToken();
  const demoRuntimeId = getDemoRuntimeId();
  const res = await fetch(url, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(demoRuntimeId ? { [DEMO_RUNTIME_HEADER]: demoRuntimeId } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  captureDemoRuntimeId(res);

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const errCode = payload?.error?.code || 'UNKNOWN_ERROR';
    const errMessage = payload?.error?.message || res.statusText;
    throw new ApiError(res.status, errCode, errMessage);
  }

  return payload;
}

async function requestBinary(path, { method = 'POST', body, signal, contentType = 'application/octet-stream' } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  const token = getAccessToken();
  const demoRuntimeId = getDemoRuntimeId();
  const res = await fetch(url, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': contentType,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(demoRuntimeId ? { [DEMO_RUNTIME_HEADER]: demoRuntimeId } : {}),
    },
    body,
  });

  captureDemoRuntimeId(res);

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const errCode = payload?.error?.code || 'UNKNOWN_ERROR';
    const errMessage = payload?.error?.message || res.statusText;
    throw new ApiError(res.status, errCode, errMessage);
  }
  return payload;
}

export const httpClient = {
  get: (path, params, options = {}) => request(path, { method: 'GET', params, ...options }),
  post: (path, body, options = {}) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body, options = {}) => request(path, { method: 'PATCH', body, ...options }),
  put: (path, body, options = {}) => request(path, { method: 'PUT', body, ...options }),
  delete: (path, options = {}) => request(path, { method: 'DELETE', ...options }),
  postBinary: (path, body, options = {}) => requestBinary(path, { method: 'POST', body, ...options }),
};

function parseSseChunk(chunk, onEvent) {
  chunk.split('\n\n').forEach((block) => {
    const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
    if (!dataLine) return;
    try {
      onEvent(JSON.parse(dataLine.slice(6)));
    } catch {
      // ignore malformed chunks
    }
  });
}

/**
 * POST + text/event-stream. Each event payload is JSON in `data: {...}` lines.
 * Returns abort() to cancel the stream.
 */
export function streamSse(path, { body, onEvent, onComplete, onError } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  const controller = new AbortController();
  const token = getAccessToken();
  const demoRuntimeId = getDemoRuntimeId();

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(demoRuntimeId ? { [DEMO_RUNTIME_HEADER]: demoRuntimeId } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      captureDemoRuntimeId(res);

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const errCode = payload?.error?.code || 'UNKNOWN_ERROR';
        const errMessage = payload?.error?.message || res.statusText;
        throw new ApiError(res.status, errCode, errMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new ApiError(500, 'STREAM_UNAVAILABLE', '스트리밍 응답을 읽을 수 없습니다.');

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        blocks.forEach((block) => parseSseChunk(`${block}\n\n`, onEvent));
      }
      if (buffer.trim()) parseSseChunk(buffer, onEvent);
      onComplete?.();
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError?.(err);
    }
  })();

  return () => controller.abort();
}

/**
 * GET + text/event-stream. Returns abort() to cancel the stream.
 */
export function streamSseGet(path, { onEvent, onComplete, onError } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  const controller = new AbortController();
  const token = getAccessToken();
  const demoRuntimeId = getDemoRuntimeId();

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(demoRuntimeId ? { [DEMO_RUNTIME_HEADER]: demoRuntimeId } : {}),
        },
        signal: controller.signal,
      });

      captureDemoRuntimeId(res);

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const errCode = payload?.error?.code || 'UNKNOWN_ERROR';
        const errMessage = payload?.error?.message || res.statusText;
        throw new ApiError(res.status, errCode, errMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new ApiError(500, 'STREAM_UNAVAILABLE', '스트리밍 응답을 읽을 수 없습니다.');

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        blocks.forEach((block) => parseSseChunk(`${block}\n\n`, onEvent));
      }
      if (buffer.trim()) parseSseChunk(buffer, onEvent);
      onComplete?.();
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError?.(err);
    }
  })();

  return () => controller.abort();
}
