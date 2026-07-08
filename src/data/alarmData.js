// Seed alarms for the mock AlarmApi. Device ids match bin/device/device_list.json
// so the picker/thumbnails resolve against the same iotApi.getDevices() list.
export const initialAlarms = [
  {
    id: 1,
    name: '평일 기상',
    timeMinute: 7 * 60, // 07:00
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
    smartWake: true,
    radarDeviceId: '3a7f2c9d10b4e85f', // 침실 하방 레이더
    deviceId: '5c1e8b6402fda973', // Wave Station
    method: { type: 'tts', speakerId: 0, text: '좋은 아침이에요! 일어날 시간입니다.', repeatCount: 3, intervalSec: 20 },
    enabled: true,
    createdAt: '2026-06-10 08:00:00',
    updatedAt: '2026-06-10 08:00:00',
  },
  {
    id: 2,
    name: '주말 늦잠',
    timeMinute: 9 * 60 + 30, // 09:30
    daysOfWeek: ['sat', 'sun'],
    smartWake: false,
    radarDeviceId: null,
    deviceId: '5d0a3f8c26b91e74', // 침실 조명 (컬러)
    method: { type: 'light_on', brightness: 70 },
    enabled: true,
    createdAt: '2026-06-12 21:00:00',
    updatedAt: '2026-06-12 21:00:00',
  },
  {
    id: 3,
    name: '낮잠 알람',
    timeMinute: 14 * 60 + 30, // 14:30, 1회성(daysOfWeek 없음)
    daysOfWeek: [],
    smartWake: false,
    radarDeviceId: null,
    deviceId: '6b0f3e8a92c47d15', // 플러그1
    method: { type: 'plug_toggle' },
    enabled: false,
    createdAt: '2026-06-20 13:00:00',
    updatedAt: '2026-06-20 13:00:00',
  },
  {
    id: 4,
    name: '외출 알림',
    timeMinute: 8 * 60 + 15, // 08:15
    daysOfWeek: ['mon', 'wed', 'fri'],
    smartWake: false,
    radarDeviceId: null,
    deviceId: '27d9a4f3c85b016e', // 거실 카메라 (Reolink)
    method: { type: 'tts', speakerId: 2, text: '외출 준비할 시간이에요.', repeatCount: 2, intervalSec: 15 },
    enabled: true,
    createdAt: '2026-06-25 07:00:00',
    updatedAt: '2026-06-25 07:00:00',
  },
];
