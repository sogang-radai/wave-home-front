import iotApi from '../../../api/iotApi';

const holdings = new Map();

// Keeps go2rtc alive across React Strict Mode remounts and overlapping players.
export async function retainCameraStream(deviceId) {
  const next = (holdings.get(deviceId) || 0) + 1;
  holdings.set(deviceId, next);
  if (next === 1)
    return iotApi.setStreaming(deviceId, true);
  return iotApi.getStreamInfo(deviceId);
}

export function releaseCameraStream(deviceId) {
  const current = holdings.get(deviceId) || 0;
  if (current <= 1) {
    holdings.delete(deviceId);
    return iotApi.setStreaming(deviceId, false).catch(() => {});
  }
  holdings.set(deviceId, current - 1);
  return Promise.resolve();
}
