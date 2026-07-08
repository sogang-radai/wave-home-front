import { cloneDeep } from './utils';

// Single canonical room/device registry shared by SettingsApi (full CRUD) and IotApi
// (read-only radar view). Mirrors insightsStore.js's role for sleep/posture/weekly-plan —
// there is exactly one source of truth, so a rename/delete in settings is immediately
// reflected wherever devices are derived from (e.g. iot.md's GET /iot/radars).
//
// The seed mirrors bin/device/device_list.json (the format the backend actually serves).
// room_id is not part of device_list.json, so each device is mapped to a room manually below.

export const ROOM_LIVING = 1;
export const ROOM_BEDROOM = 2;
export const ROOM_KITCHEN = 3;

const roomsSeed = [
  { id: ROOM_LIVING, name: '거실', description: '거실' },
  { id: ROOM_BEDROOM, name: '침실', description: '침실' },
  { id: ROOM_KITCHEN, name: '부엌', description: '부엌' },
];

// input: state-collecting devices (radar/camera); output: controllable devices (plug/TV/light).
// Settings UI merges both into a flat list; IotApi uses only the radar-derived view.
const devicesSeed = {
  input_devices: [
    {
      id: '3a7f2c9d10b4e85f',
      room_id: ROOM_BEDROOM,
      name: '침실 하방 레이더',
      description: 'SRS R4SN mmWave 레이더',
      vendor: 'SRS',
      model: 'Retina-4SN',
      enabled: true,
      class: 'srs_r4sn',
      interface: {
        host: '192.168.0.33',
        mac: '68:96:6A:4C:69:D4',
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
      id: '5c1e8b6402fda973',
      room_id: ROOM_BEDROOM,
      name: 'Wave Station',
      description: '침실 Wave Station',
      vendor: 'RADAI',
      model: 'Wave Station',
      enabled: true,
      class: 'wave_station',
      interface: {
        host: '192.168.0.150',
        port: 8765,
      },
      settings: {
        sample_rate: 16000,
        sample_size: 16,
        channels: 1,
      },
    },
    {
      id: 'a3d7c91e2f0486b5',
      room_id: ROOM_BEDROOM,
      name: '폰 카메라',
      description: 'DroidCam 폰 카메라',
      vendor: 'Dev47Apps',
      model: 'DroidCam WiFi',
      enabled: true,
      class: 'droid_cam',
      interface: {
        host: '192.168.0.23',
        mac: '6A:49:10:A2:0C:EC',
        port: 4747,
        go2rtc: true,
      },
    },
    {
      id: '27d9a4f3c85b016e',
      room_id: ROOM_LIVING,
      name: '거실 카메라',
      description: '거실 IoT 카메라',
      vendor: 'Reolink',
      model: 'E1 Pro',
      enabled: true,
      class: 'reolink_e1_pro',
      interface: {
        host: '192.168.0.50',
        mac: '94:8C:D7:A2:6A:97',
        user: 'enc:0500120444',
        password: 'enc:0500120444595d5e51',
        rtsp_port: 554,
        go2rtc: true,
      },
    },
  ],
  output_devices: [
    {
      id: '6b0f3e8a92c47d15',
      room_id: ROOM_LIVING,
      name: '플러그1',
      description: '거실 스마트 플러그1 - 에어컨',
      vendor: 'Tenpl',
      model: 'EP2-H',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.37',
        mac: '50:8B:B9:9F:6E:83',
        device_id: 'eb61aa6ce49add5d80yfcj',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '1f8c5a2e7b93064d',
      room_id: ROOM_LIVING,
      name: '플러그2',
      description: '거실 스마트 플러그2 - 선풍기',
      vendor: 'Tenpl',
      model: 'EP2-H',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.38',
        mac: '50:8B:B9:9F:6E:83',
        device_id: 'eb81849da1465e6d64luja',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '4a2d9c7f1e60b358',
      room_id: ROOM_BEDROOM,
      name: '플러그3',
      description: '침실 스마트 플러그 - 컴퓨터',
      vendor: 'Tenpl',
      model: 'EP2-H',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.39',
        mac: '50:8B:B9:9F:6E:83',
        device_id: 'eb3646ff62e21274bbee9v',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '7e3b1d8a5f02c964',
      room_id: ROOM_KITCHEN,
      name: '플러그4',
      description: '부엌 스마트 플러그 - 선풍기',
      vendor: 'Tenpl',
      model: 'EP2-H',
      enabled: true,
      class: 'tuya_ep2h',
      interface: {
        host: '192.168.0.40',
        mac: '50:8B:B9:9F:6E:83',
        device_id: 'ebf361525181a5fe4e6rcp',
        local_key: 's^q2?;Ur|q{SlG(>',
        version: '3.3',
      },
    },
    {
      id: '2c9f6a1b4d78e350',
      room_id: ROOM_BEDROOM,
      name: 'TV',
      description: '침실 책상 - 삼성 32인치 TV',
      vendor: 'Samsung',
      model: 'G7 G70D S32DG700',
      enabled: true,
      class: 'samsung_g7',
      interface: {
        host: '192.168.0.24',
        mac: '04:E4:B6:A9:8D:0A',
        token: '13135473',
      },
    },
    {
      id: '5d0a3f8c26b91e74',
      room_id: ROOM_LIVING,
      name: '거실 조명',
      description: '거실 조명 - 화이트',
      vendor: 'Philips',
      model: 'WiZ White E29',
      enabled: true,
      class: 'philips_wiz_e29_white',
      interface: { host: '192.168.0.55', mac: '98:77:D5:E6:BF:72', port: 38899 },
    },
    {
      id: '3f7c2a9e14d8065b',
      room_id: ROOM_BEDROOM,
      name: '침실 조명',
      description: '침실 조명 - 컬러',
      vendor: 'Philips',
      model: 'WiZ Color E29',
      enabled: true,
      class: 'philips_wiz_e29_color',
      interface: { host: '192.168.0.51', mac: '98:77:D5:D0:B4:42', port: 38899 },
    },
    {
      id: '6a1e4b8d3f05c927',
      room_id: ROOM_KITCHEN,
      name: '부엌 조명',
      description: '부엌 조명 - 화이트',
      vendor: 'Philips',
      model: 'WiZ White E29',
      enabled: true,
      class: 'philips_wiz_e29_white',
      interface: { host: '192.168.0.83', mac: '98:77:D5:D0:B4:42', port: 38899 },
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
