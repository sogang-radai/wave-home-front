import { cloneDeep } from './utils';

// Single canonical room/device registry shared by SettingsApi (full CRUD) and HomeApi
// (read-only radar view). Mirrors insightsStore.js's role for sleep/posture/weekly-plan —
// there is exactly one source of truth, so a rename/delete in settings is immediately
// reflected wherever devices are derived from (e.g. home.md's GET /home/radars).

const roomsSeed = [
  { id: '7c4a9e2f18b356d0', name: '책상', description: '책상' },
  { id: '3f91c6e52ad047b8', name: '침실', description: '침실' },
];

const devicesSeed = {
  input_devices: [
    {
      id: '8d2e5a1c49f7036b',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 레이더',
      description: 'SRS R4SN mmWave 레이더',
      enabled: true,
      class: 'srs_r4sn',
      interface: {
        host: '192.168.0.33',
        point_cloud: { enabled: true, port: 29172 },
        iq: { enabled: true, port: 29171 },
      },
      settings: {
        angle_z: 0.0,
        angle_y: 0.0,
        min_x: -5.0,
        max_x: 5.0,
        min_y: 0.0,
        max_y: 10.0,
        min_z: -2.0,
        max_z: 2.0,
      },
    },
    {
      id: '1a6f3e8d02c75491',
      room_id: '3f91c6e52ad047b8',
      name: '침실 마이크',
      description: 'ESP32 + INMP441, 16kHz 16bit mono',
      enabled: true,
      class: 'wave_mic',
      interface: { host: '192.168.0.50', port: 8765 },
      settings: { sample_rate: 16000, sample_size: 16, channels: 1 },
    },
    {
      id: '6b904f2e17d83ac5',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 카메라',
      description: 'USB Wave Camera',
      enabled: true,
      class: 'wave_cam',
      interface: { transport: 'usb', backend: 'v4l2', device: '/dev/video0' },
    },
    {
      id: 'c5281a7e93bf406d',
      room_id: '3f91c6e52ad047b8',
      name: '침실 카메라',
      description: 'Network Wave Camera',
      enabled: true,
      class: 'wave_cam',
      interface: { transport: 'tcp', backend: 'droidcam', host: '192.168.0.51', port: 4747 },
    },
    {
      id: '2e8d1795c0463f5a',
      room_id: '7c4a9e2f18b356d0',
      name: 'IR 수신기',
      description: 'LIRC IR 수신',
      enabled: true,
      class: 'ir_reciever',
      interface: { transport: 'lirc', device: '/dev/lirc0' },
    },
  ],
  output_devices: [
    {
      id: '9a4c71e36b0285fd',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 스마트 플러그',
      description: 'EP2H Tuya IoT 플러그',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.37',
        device_id: 'eb61aa6ce49add5d80yfcj',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '5e3b80a1f2496cde',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 TV',
      description: '삼성 32인치 TV',
      enabled: true,
      class: 'tizen_tv',
      interface: { host: '192.168.0.70', port: 8002, name: 'WaveHome-TV' },
    },
    {
      id: '0f8c2d6b147ae953',
      room_id: '7c4a9e2f18b356d0',
      name: '거실 에어컨 IR',
      description: 'LIRC IR 송신, 에어컨 제어',
      enabled: true,
      class: 'ir_remote',
      interface: { transport: 'lirc', device: '/dev/lirc1', command_list: './ir/ac_commands.txt' },
    },
    {
      id: 'd7139e58a04b6c21',
      room_id: '3f91c6e52ad047b8',
      name: '침실 조명',
      description: 'Philips Hue 전구',
      enabled: true,
      class: 'hue_light',
      interface: { bridge_host: '192.168.0.80', username: 'hue-bridge-api-key-placeholder', light_id: 1 },
    },
    {
      id: '4b2a90e7c1586d3f',
      room_id: '3f91c6e52ad047b8',
      name: '침실 블라인드',
      description: 'Tuya 스마트 블라인드',
      enabled: false,
      class: 'tuya_blind',
      interface: {
        host: '192.168.0.61',
        device_id: 'bfabcdef12345678',
        local_key: 'f0e1d2c3b4a59687',
        version: '3.3',
      },
    },
  ],
};

const rooms = cloneDeep(roomsSeed);
const devices = cloneDeep(devicesSeed);

export function getRooms() {
  return rooms;
}

export function addRoom(room) {
  rooms.push(room);
}

export function removeRoom(roomId) {
  const index = rooms.findIndex((room) => room.id === roomId);
  if (index !== -1) rooms.splice(index, 1);
}

export function getDevices() {
  return devices;
}

export function getAllDevices() {
  return [...devices.input_devices, ...devices.output_devices];
}

export function getDevicesByClass(deviceClass) {
  return getAllDevices().filter((device) => device.class === deviceClass);
}

export function addDeviceToBucket(bucket, device) {
  devices[bucket].push(device);
}

export function findDeviceEntry(deviceId) {
  for (const bucket of ['input_devices', 'output_devices']) {
    const index = devices[bucket].findIndex((device) => device.id === deviceId);
    if (index !== -1) return { bucket, index, device: devices[bucket][index] };
  }
  return null;
}

export function moveDeviceBucket(found, nextBucket, updatedDevice) {
  devices[found.bucket].splice(found.index, 1);
  devices[nextBucket].push(updatedDevice);
}

export function replaceDeviceAt(found, updatedDevice) {
  devices[found.bucket][found.index] = updatedDevice;
}

export function removeDeviceAt(found) {
  devices[found.bucket].splice(found.index, 1);
}
