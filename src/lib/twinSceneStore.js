import { TWIN_DEVICES } from '../data/twinSceneConfig';

const listeners = new Set();

/** @type {Map<string, { connected: boolean, on: boolean, state: object }>} */
let deviceOverrides = new Map();

export function subscribeTwinScene(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function getTwinDeviceOverrides() {
  return deviceOverrides;
}

export function setTwinDeviceOverride(deviceId, patch) {
  const prev = deviceOverrides.get(deviceId) || { connected: true, on: false, state: {} };
  deviceOverrides.set(deviceId, {
    ...prev,
    ...patch,
    state: { ...prev.state, ...(patch.state || {}) },
  });
  notify();
}

function toWireDeviceId(deviceId) {
  if (typeof deviceId === 'string' && /^[0-9a-fA-F]{16}$/.test(deviceId)) return deviceId.toLowerCase();
  if (typeof deviceId === 'number' && Number.isFinite(deviceId) && deviceId >= 0) {
    return deviceId.toString(16).padStart(16, '0');
  }
  return null;
}

function resolveTwinEntry(deviceName, deviceId) {
  const wireId = toWireDeviceId(deviceId);
  if (wireId) {
    const byId = TWIN_DEVICES.find((d) => d.deviceId === wireId);
    if (byId) return byId;
  }
  if (!deviceName) return null;
  return TWIN_DEVICES.find((d) => deviceName.includes(d.name) || d.name.includes(deviceName)) || null;
}

/** Push a device state snapshot into the twin (IoT panel / agent). */
export function dispatchTwinDeviceState(deviceId, state = {}, { deviceName, action } = {}) {
  const entry = resolveTwinEntry(deviceName, deviceId);
  if (!entry) return;

  const next = state && typeof state === 'object' ? { ...state } : {};
  let on;
  if (action === 'on') on = true;
  if (action === 'off') on = false;
  if (action === 'toggle') on = next.on ?? next.switch;
  if (action === 'color' || action === 'brightness' || action === 'temperature') on = true;
  if (next.on !== undefined) on = !!next.on;
  if (next.switch !== undefined) on = !!next.switch;

  setTwinDeviceOverride(entry.deviceId, {
    connected: true,
    ...(on !== undefined ? { on: !!on } : {}),
    ...(Object.keys(next).length ? { state: next } : {}),
  });
}

/** Map agent control_device tool result → local override for immediate 3D refresh. */
export function dispatchTwinControlFromToolEvent(toolEvent) {
  const args = toolEvent.args || {};
  const result = toolEvent.result || {};
  const deviceName = result.deviceName || args.device;
  const action = args.action || result.action;
  const state = result.state && typeof result.state === 'object' ? result.state : {};
  const params = args.params && typeof args.params === 'object' ? args.params : {};
  const merged = { ...state };

  if (action === 'color') {
    const color = merged.color || params.color || (
      params.r !== undefined ? { r: params.r, g: params.g, b: params.b } : null
    );
    if (color) merged.color = color;
  }
  if (action === 'brightness') {
    const brightness = merged.brightness ?? params.value ?? params.brightness;
    if (brightness !== undefined) merged.brightness = brightness;
  }
  if (action === 'temperature') {
    const temperature = merged.temperature ?? params.value ?? params.temperature ?? params.temp;
    if (temperature !== undefined) merged.temperature = temperature;
  }

  dispatchTwinDeviceState(result.deviceId, merged, { deviceName, action });
}

export function clearTwinDeviceOverrides() {
  deviceOverrides = new Map();
  notify();
}
