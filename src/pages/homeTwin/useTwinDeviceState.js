import { useEffect, useState } from 'react';
import iotApi from '../../api/iotApi';
import { TWIN_DEVICES } from '../../data/twinSceneConfig';
import { getTwinDeviceOverrides, subscribeTwinScene } from '../../lib/twinSceneStore';

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

export function useTwinDeviceState() {
  const [devices, setDevices] = useState([]);
  const [states, setStates] = useState({});
  const [overrides, setOverrides] = useState(getTwinDeviceOverrides());

  useEffect(() => subscribeTwinScene(() => setOverrides(new Map(getTwinDeviceOverrides()))), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await iotApi.getDevices();
        if (!active) return;
        setDevices(list);
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
        setStates(Object.fromEntries(pairs));
      } catch {
        if (active) setDevices([]);
      }
    };
    load();
    const timer = setInterval(load, 2000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const viewModels = TWIN_DEVICES.filter((t) => t.showInTwin !== false).map((twin) => {
    const apiDevice = devices.find((d) => d.id === twin.deviceId);
    const entry = states[twin.deviceId];
    const override = overrides.get(twin.deviceId);
    const device = apiDevice || { id: twin.deviceId, name: twin.name, connected: false, class: 'unknown' };
    const rawState = entry?.state || {};
    // Optimistic color/brightness from overrides, but live on/switch always wins once polled.
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
  });

  return { viewModels, devices };
}
