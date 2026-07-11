import { cloneDeep } from './utils';

// Canonical room/device registry for mock SettingsApi + IotApi.
// IDs: DB INTEGER PK rendered as 16-char sequential hex (0000000000000001 …).
// Mirrors bin/device/device_list.json; rooms come from DB only (no rooms.json).

export function hexId(n) {
  return n.toString(16).padStart(16, '0');
}

export const ROOM_LIVING = hexId(1);
export const ROOM_BEDROOM = hexId(2);
export const ROOM_KITCHEN = hexId(3);

const roomsSeed = [
  { id: ROOM_LIVING, name: '거실', description: '거실' },
  { id: ROOM_BEDROOM, name: '침실', description: '침실' },
  { id: ROOM_KITCHEN, name: '부엌', description: '부엌' },
];

const devicesSeed = {
  input_devices: 
    [
      {
        "id": "0000000000000001",
        "room_id": "0000000000000002",
        "name": "침실 하방 레이더",
        "description": "SRS R4SN mmWave 레이더",
        "vendor": "SRS",
        "model": "Retina-4SN",
        "enabled": true,
        "class": "srs_r4sn",
        "interface": {
          "host": "192.168.0.33",
          "iq": {
            "enabled": true,
            "port": 29171
          },
          "mac": "68:96:6A:4C:69:D4",
          "point_cloud": {
            "enabled": true,
            "port": 29172
          }
        },
        "settings": {
          "sleep": true,
          "angle_z": 0.0,
          "angle_y": 0.0,
          "min_x": -5.0,
          "max_x": 5.0,
          "min_y": 0.0,
          "max_y": 10.0,
          "min_z": -2.0,
          "max_z": 2.0
        }
      },
      {
        "id": "0000000000000002",
        "room_id": "0000000000000002",
        "name": "침실 책상 레이더",
        "description": "SRS R4SN mmWave 레이더 (책상, 제스처 감지용)",
        "vendor": "SRS",
        "model": "Retina-4SN",
        "enabled": true,
        "class": "srs_r4sn",
        "interface": {
          "host": "192.168.0.163",
          "iq": {
            "enabled": true,
            "port": 29171
          },
          "mac": "68:96:6A:4C:6B:12",
          "point_cloud": {
            "enabled": true,
            "port": 29172
          }
        },
        "settings": {
          "sleep": false,
          "angle_z": 0.0,
          "angle_y": 0.0,
          "min_x": -3.0,
          "max_x": 3.0,
          "min_y": 0.0,
          "max_y": 3.0,
          "min_z": -1.5,
          "max_z": 1.5,
          "gesture_set": "set"
        }
      },
      {
        "id": "0000000000000003",
        "room_id": "0000000000000002",
        "name": "Wave Station",
        "description": "침실 Wave Station",
        "vendor": "RADAI",
        "model": "Wave Station",
        "enabled": true,
        "class": "wave_station",
        "interface": {
          "host": "192.168.0.56",
          "port": 41737
        },
        "settings": {
          "sample_rate": 16000,
          "sample_size": 16,
          "channels": 1
        }
      },
      {
        "id": "0000000000000004",
        "room_id": "0000000000000001",
        "name": "폰 카메라",
        "description": "DroidCam 폰 카메라",
        "vendor": "Dev47Apps",
        "model": "DroidCam WiFi",
        "enabled": true,
        "class": "droid_cam",
        "interface": {
          "host": "192.168.0.23",
          "mac": "6A:49:10:A2:0C:EC",
          "port": 4747,
          "go2rtc": true
        }
      },
      {
        "id": "0000000000000005",
        "room_id": "0000000000000001",
        "name": "거실 카메라",
        "description": "거실 IoT 카메라",
        "vendor": "Reolink",
        "model": "E1 Pro",
        "enabled": true,
        "class": "reolink_e1_pro",
        "interface": {
          "go2rtc": true,
          "host": "192.168.0.50",
          "mac": "94:8C:D7:A2:6A:97",
          "password": "enc:0500120444595d5e51",
          "rtsp_port": 554,
          "user": "enc:0500120444"
        }
      }
    ],
  output_devices:     [
      {
        "id": "0000000000000006",
        "room_id": "0000000000000001",
        "name": "플러그1 - 선풍기",
        "description": "거실 선풍기 스마트 플러그",
        "vendor": "Tenpl",
        "model": "EP2-H",
        "enabled": true,
        "class": "tuya_ep2h",
        "interface": {
          "device_id": "eb61aa6ce49add5d80yfcj",
          "host": "192.168.0.37",
          "local_key": "s^q2?;Ur|q{SlG(>",
          "mac": "50:8B:B9:9F:6E:83",
          "version": "3.3"
        }
      },
      {
        "id": "0000000000000007",
        "room_id": "0000000000000002",
        "name": "플러그2 - 컴퓨터",
        "description": "침실 컴퓨터 스마트 플러그",
        "vendor": "Tenpl",
        "model": "EP2-H",
        "enabled": true,
        "class": "tuya_ep2h",
        "interface": {
          "device_id": "ebf361525181a5fe4e6rcp",
          "host": "192.168.0.54",
          "local_key": "fVvBspSXY5oEhtJE",
          "mac": "50:8B:B9:9E:88:3C",
          "version": "3.3"
        }
      },
      {
        "id": "0000000000000008",
        "room_id": "0000000000000002",
        "name": "플러그3 - 에어컨",
        "description": "침실 에어컨 스마트 플러그",
        "vendor": "Tenpl",
        "model": "EP2-H",
        "enabled": true,
        "class": "tuya_ep2h",
        "interface": {
          "device_id": "eb3646ff62e21274bbee9v",
          "host": "192.168.0.53",
          "local_key": "/2W'DMzaGa?1&e>L",
          "mac": "50:8B:B9:A2:7B:A6",
          "version": "3.3"
        }
      },
      {
        "id": "0000000000000009",
        "room_id": "0000000000000003",
        "name": "플러그4 - 인덕션",
        "description": "부엌 인덕션 스마트 플러그",
        "vendor": "Tenpl",
        "model": "EP2-H",
        "enabled": true,
        "class": "tuya_ep2h",
        "interface": {
          "device_id": "eb81849da1465e6d64luja",
          "host": "192.168.0.52",
          "local_key": "Ua|r'`.u=]>$pIqP",
          "mac": "50:8B:B9:A6:42:5F",
          "version": "3.3"
        }
      },
      {
        "id": "000000000000000a",
        "room_id": "0000000000000002",
        "name": "침실 TV",
        "description": "침실 책상 - 삼성 32인치 TV",
        "vendor": "Samsung",
        "model": "G7 G70D S32DG700",
        "enabled": true,
        "class": "samsung_g7",
        "interface": {
          "host": "192.168.0.24",
          "mac": "04:E4:B6:A9:8D:0A",
          "token": "13135473"
        }
      },
      {
        "id": "000000000000000b",
        "room_id": "0000000000000002",
        "name": "침실 조명",
        "description": "침실 조명 - 컬러",
        "vendor": "Philips",
        "model": "WiZ Color E29",
        "enabled": true,
        "class": "philips_wiz_e29_color",
        "interface": {
          "host": "192.168.0.51",
          "mac": "98:77:D5:D0:B4:42",
          "port": 38899
        }
      },
      {
        "id": "000000000000000c",
        "room_id": "0000000000000001",
        "name": "거실 조명",
        "description": "거실 조명 - 화이트",
        "vendor": "Philips",
        "model": "WiZ White E29",
        "enabled": true,
        "class": "philips_wiz_e29_white",
        "interface": {
          "host": "192.168.0.55",
          "mac": "98:77:D5:E6:BF:72",
          "port": 38899
        }
      },
      {
        "id": "000000000000000d",
        "room_id": "0000000000000003",
        "name": "부엌 조명",
        "description": "부엌 조명 - 화이트",
        "vendor": "Philips",
        "model": "WiZ White E29",
        "enabled": true,
        "class": "philips_wiz_e29_white",
        "interface": {
          "host": "192.168.0.83",
          "mac": "98:77:D5:D0:B4:42",
          "port": 38899
        }
      }
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

