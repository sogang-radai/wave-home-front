import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getAccessToken() {
  return localStorage.getItem('wavehome_access_token');
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
  }

  const token = getAccessToken();
  const res = await fetch(url, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

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

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

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
