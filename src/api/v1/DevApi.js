import { API_BASE_URL } from '../config';

function resolveWsBase() {
  if (typeof window === 'undefined') return 'ws://localhost';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // API_BASE_URL is typically '/api/v1' (relative) or absolute.
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    const url = new URL(API_BASE_URL);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}${url.pathname.replace(/\/$/, '')}`;
  }
  return `${protocol}//${window.location.host}${API_BASE_URL.replace(/\/$/, '')}`;
}

export class DevApi {
  /** @returns {string} */
  devStreamUrl(deviceId) {
    const base = resolveWsBase();
    const qs = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
    return `${base}/dev/stream${qs}`;
  }

  /**
   * Receive-only WebSocket snapshot stream for gesture debug.
   * @returns {{ close: () => void }}
   */
  subscribeDevStream(deviceId, { onSnapshot, onState } = {}) {
    if (!deviceId) {
      onState?.('closed');
      return { close() {} };
    }

    onState?.('connecting');
    const ws = new WebSocket(this.devStreamUrl(deviceId));

    ws.onopen = () => onState?.('live');
    ws.onclose = () => onState?.('closed');
    ws.onerror = () => onState?.('error');
    ws.onmessage = (ev) => {
      try {
        onSnapshot?.(JSON.parse(ev.data));
      } catch {
        // ignore malformed frames
      }
    };

    return {
      close() {
        try {
          ws.close();
        } catch {
          // ignore
        }
      },
    };
  }
}
