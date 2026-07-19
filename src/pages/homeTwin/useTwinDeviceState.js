import { useEffect, useMemo, useRef, useState } from 'react';
import iotApi from '../../api/iotApi';
import { isTwinDeviceVisible, TWIN_DEVICES } from '../../data/twinSceneConfig';
import { getTwinDeviceOverrides, subscribeTwinScene } from '../../lib/twinSceneStore';

const TWIN_POLL_MS = 4000;

function isOnForTwin(twin, deviceClass, state) {
  if (!state) return false;
  if (deviceClass === 'tuya_ep2h' || twin.kind === 'plug' || twin.kind === 'fan' || twin.kind === 'induction') {
    return !!state.switch;
  }
  if (
    deviceClass === 'philips_wiz_e29_color'
    || deviceClass === 'philips_wiz_e29_white'
    || deviceClass === 'samsung_g7'
    || deviceClass === 'tizen_tv'
    || twin.kind === 'light'
    || twin.kind === 'tv'
  ) {
    return !!state.on;
  }
  return false;
}

function hasLivePowerField(state) {
  return state?.on !== undefined || state?.switch !== undefined;
}

/** Twin visuals only care about power/color — ignore plug wattage jitter. */
function visualFingerprint(states, devices, overrides) {
  const deviceById = new Map(devices.map((d) => [d.id, d]));
  return TWIN_DEVICES.filter((t) => isTwinDeviceVisible(t)).map((twin) => {
    const device = deviceById.get(twin.deviceId);
    const rawState = states[twin.deviceId]?.state || {};
    const override = overrides.get(twin.deviceId);
    const mergedState = { ...rawState, ...(override?.state || {}) };
    if (rawState.on !== undefined) mergedState.on = rawState.on;
    if (rawState.switch !== undefined) mergedState.switch = rawState.switch;
    const connected = override?.connected ?? device?.connected ?? false;
    const on = hasLivePowerField(rawState)
      ? isOnForTwin(twin, device?.class, mergedState)
      : (override?.on ?? false);
    const color = mergedState.color;
    return [
      twin.deviceId,
      connected ? 1 : 0,
      on ? 1 : 0,
      mergedState.brightness ?? '',
      mergedState.temperature ?? '',
      color?.r ?? '',
      color?.g ?? '',
      color?.b ?? '',
    ].join(':');
  }).join('|');
}

export function useTwinDeviceState() {
  const [devices, setDevices] = useState([]);
  const [states, setStates] = useState({});
  const [overrides, setOverrides] = useState(getTwinDeviceOverrides());
  const fingerprintRef = useRef('');

  useEffect(() => subscribeTwinScene(() => setOverrides(new Map(getTwinDeviceOverrides()))), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await iotApi.getDevices();
        if (!active) return;
        const twinIds = new Set(TWIN_DEVICES.map((d) => d.deviceId));
        const relevant = list.filter((d) => twinIds.has(d.id));
        const pairs = await Promise.all(
          relevant.map(async (d) => {
            try {
              const state = await iotApi.getDeviceState(d.id);
              return [d.id, { device: d, state }];
            } catch {
              return [d.id, { device: d, state: {} }];
            }
          }),
        );
        if (!active) return;
        const nextStates = Object.fromEntries(pairs);
        const nextFp = visualFingerprint(nextStates, list, getTwinDeviceOverrides());
        if (nextFp === fingerprintRef.current) return;
        fingerprintRef.current = nextFp;
        setDevices(list);
        setStates(nextStates);
      } catch {
        if (active) setDevices([]);
      }
    };
    load();
    const timer = setInterval(load, TWIN_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);

  // Recompute fingerprint when overrides change so agent/IoT optimistic updates apply.
  useEffect(() => {
    fingerprintRef.current = visualFingerprint(states, devices, overrides);
  }, [overrides, states, devices]);

  const viewModels = useMemo(
    () => TWIN_DEVICES.filter((t) => isTwinDeviceVisible(t)).map((twin) => {
      const apiDevice = devices.find((d) => d.id === twin.deviceId);
      const entry = states[twin.deviceId];
      const override = overrides.get(twin.deviceId);
      const device = apiDevice || { id: twin.deviceId, name: twin.name, connected: false, class: 'unknown' };
      const rawState = entry?.state || {};
      const mergedState = { ...rawState, ...(override?.state || {}) };
      if (rawState.on !== undefined) mergedState.on = rawState.on;
      if (rawState.switch !== undefined) mergedState.switch = rawState.switch;
      const connected = override?.connected ?? device.connected ?? false;
      const on = hasLivePowerField(rawState)
        ? isOnForTwin(twin, device.class, mergedState)
        : (override?.on ?? false);
      return {
        ...twin,
        device,
        connected,
        on,
        state: mergedState,
        stateSummary: device.stateSummary || '',
      };
    }),
    [devices, states, overrides],
  );

  return { viewModels, devices };
}
