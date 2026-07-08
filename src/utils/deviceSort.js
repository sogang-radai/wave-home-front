export function isDeviceOnline(device) {
  const status = device?.connectionStatus
    || (device?.connected ? 'online' : 'offline');
  return status === 'online' || status === 'initializing';
}

/** IoT 제어 그리드: 연결된 장치 우선, 동일 그룹 내 등록 순서 유지 */
export function sortDevicesForControl(devices) {
  return devices
    .map((device, index) => ({ device, index }))
    .sort((a, b) => {
      const aOnline = isDeviceOnline(a.device);
      const bOnline = isDeviceOnline(b.device);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ device }) => device);
}
