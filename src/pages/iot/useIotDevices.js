import { useEffect, useMemo, useRef, useState } from 'react';
import iotApi from '../../api/iotApi';
import { isDemoHiddenDevice } from '../../api/config';
import { isDeviceOffline, sortDevicesForControl } from './iotUtils';

// Shared device-list/detail state — used by the plain IoT 제어 grid
// (IotControlTab) and by the merged 디지털 트윈 홈 sidebar (HomeTwinPage),
// so both stay in sync with the same fetch/poll/selection behavior.
export function useIotDevices() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [detailTab, setDetailTab] = useState('control');
  const [allDeviceRules, setAllDeviceRules] = useState([]);
  const [deviceEvents, setDeviceEvents] = useState([]);
  const [reconnectingId, setReconnectingId] = useState(null);
  const [toast, setToast] = useState('');

  const devicesPollRef = useRef(null);
  const devicesAbortRef = useRef(null);

  const loadDevices = () => {
    if (devicesPollRef.current)
      return devicesPollRef.current;

    if (devicesAbortRef.current)
      devicesAbortRef.current.abort();

    const controller = new AbortController();
    devicesAbortRef.current = controller;

    devicesPollRef.current = iotApi.getDevices({ signal: controller.signal })
      .then((list) => {
        setDevices(list);
        setDevicesError('');
      })
      .catch((err) => {
        if (err?.name === 'AbortError')
          return;
        setDevicesError(err?.message || '장치 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        devicesPollRef.current = null;
        if (devicesAbortRef.current === controller)
          devicesAbortRef.current = null;
        setDevicesLoading(false);
      });

    return devicesPollRef.current;
  };

  useEffect(() => {
    iotApi.getRooms().then(setRooms);
    loadDevices();
    const timer = setInterval(loadDevices, 3000);
    const loadingCap = setTimeout(() => setDevicesLoading(false), 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(loadingCap);
      if (devicesAbortRef.current)
        devicesAbortRef.current.abort();
    };
  }, []);

  const filteredDevices = useMemo(() => {
    const list = roomFilter === 'all'
      ? devices
      : devices.filter((d) => String(d.room?.id ?? '') === String(roomFilter));
    return sortDevicesForControl(list.filter((d) => !isDemoHiddenDevice(d)));
  }, [devices, roomFilter]);

  // Always keep exactly one device selected — the grid/list never shows an
  // unselected state. Falls back to the first device in the filtered list
  // whenever the current selection is missing or filtered out.
  useEffect(() => {
    if (filteredDevices.length === 0) {
      if (selectedDeviceId !== null) setSelectedDeviceId(null);
      return;
    }
    if (!filteredDevices.some((d) => d.id === selectedDeviceId)) {
      setSelectedDeviceId(filteredDevices[0].id);
      setDetailTab('control');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDevices]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  const refreshDeviceRules = (deviceId) => {
    if (!deviceId) return;
    iotApi.getRulesForDevice(deviceId).then(setAllDeviceRules);
  };

  useEffect(() => {
    if (!selectedDevice) return;
    refreshDeviceRules(selectedDevice.id);
    iotApi.getEvents({ deviceId: selectedDevice.id }).then(setDeviceEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.id, detailTab]);

  const selectDevice = (device) => {
    setSelectedDeviceId(device.id);
    if (isDeviceOffline(device)) {
      setDetailTab('log');
      iotApi.getEvents({ deviceId: device.id }).then(setDeviceEvents);
    } else {
      setDetailTab('control');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const reconnect = async (event, device) => {
    event.stopPropagation();
    setReconnectingId(device.id);
    try {
      await iotApi.reconnectDevice(device.id);
      await loadDevices();
      iotApi.getEvents({ deviceId: device.id }).then(setDeviceEvents);
      showToast(`${device.name} 재연결 시도 완료`);
    } catch (err) {
      showToast(err.message || '재연결에 실패했습니다.');
    } finally {
      setReconnectingId(null);
    }
  };

  const onlineCount = devices.filter((d) => !isDeviceOffline(d)).length;

  return {
    rooms,
    devices,
    devicesLoading,
    devicesError,
    roomFilter,
    setRoomFilter,
    filteredDevices,
    selectedDevice,
    selectedDeviceId,
    setSelectedDeviceId,
    selectDevice,
    detailTab,
    setDetailTab,
    allDeviceRules,
    deviceEvents,
    reconnectingId,
    reconnect,
    toast,
    showToast,
    loadDevices,
    onlineCount,
  };
}
