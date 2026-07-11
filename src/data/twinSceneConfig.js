// GLTF scene ↔ device_list.json mapping for Home Twin.
// Model: public/models/model_house.gltf (Blender Y-up).
//
// living_cam GLTF local translation ≈ [1.054, 0.9, -2.652].
// User reference (1.0537, 2.6517, 0.9935) likely uses a different axis label;
// POV camera uses getWorldPosition() at runtime (see twinCamera.js).

export const TWIN_MODEL_URL = `${process.env.PUBLIC_URL || ''}/models/model_house.gltf`;

export const TWIN_ROOMS = [
  {
    id: '0000000000000002',
    gltfRoot: 'bed_room',
    label: '침실',
    walls: ['bed_px', 'bed_mx', 'bed_py', 'bed_my'],
    overlay: { position: [-1.25, 1.15, 1.4], size: [3.5, 2.3, 3.2] },
  },
  {
    id: '0000000000000001',
    gltfRoot: 'living_room',
    label: '거실',
    walls: ['living_px', 'living_mx', 'living_py', 'living_my'],
    overlay: { position: [0, 1.15, -1.6], size: [6, 2.3, 2.8] },
  },
  {
    id: '0000000000000003',
    gltfRoot: 'kitchen_room',
    label: '부엌',
    walls: ['kitchen_px', 'kitchen_mx', 'kitchen_my'],
    overlay: { position: [1.75, 1.15, 1.35], size: [2.5, 2.3, 3.3] },
  },
];

/** @typedef {'tv'|'light'|'plug'|'fan'|'induction'|'label'} TwinVisualKind */

/**
 * labelOffset is a world-space [x, y, z] offset from the GLTF anchor node.
 * cardDescription: 홈 뷰어 호버 안내카드 중간행. 비우면 on/off·대기 상태를 표시.
 * @type {Array<{ deviceId: string, name: string, roomId: string, gltfRoot: string, anchor: string, kind: TwinVisualKind, labelOffset?: number[], cardDescription?: string, shadeNode?: string, pivotNode?: string, glowNode?: string, bladeNode?: string, screenNode?: string, wind?: boolean, windNode?: string, showInTwin?: boolean }>}
 */

const DEVICE_DESCRIPTIONS = {
  "1": "수면 모니터링을 위해 수면 상태, 뒤척임, 심박, 호흡을 측정하는 레이더 센서입니다.",
  "2": "책상 앞 자세 및 제스처를 포착하는 레이더 센서입니다.",
  "3": "Wave Station은 레거시 IR 장치 제어 및 코골이 측정, 음성안내, 조도 및 온습도 측정을 위한 종합 장치입니다.",
  "4": "스마트폰 카메라를 사용할 수 있도록 대기하는 카메라 센서입니다.",
  "5": "거실의 이벤트를 살피고, 원격으로 확인할 수 있는 카메라 입니다.",
  "6": "선풍기와 연결된 전력 측정이 가능한 스마트 플러그입니다.",
  "7": "컴퓨터와 연결된 전력 측정이 가능한 스마트 플러그입니다.",
  "8": "에어컨과 연결된 전력 측정이 가능한 스마트 플러그입니다.",
  "9": "인덕션과 연결된 전력 측정이 가능한 스마트 플러그입니다.",
  "10": "침실에서 PC나 TV겸용으로 사용하는 모니터입니다.",
  "11": "침실에 있는 RGB색상을 설정 가능한 컬러 조명입니다.",
  "12": "거실에 있는 색 온도 조절이 가능한 화이트 조명입니다.",
  "13": "부엌에 있는 색 온도 조절이 가능한 화이트 조명입니다.",
};

export const TWIN_DEVICES = [
  { deviceId: '0000000000000001', name: '침실 하방 레이더', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_downward_radar', labelOffset: [0, 0.1, -0.06], kind: 'label', cardDescription: DEVICE_DESCRIPTIONS['1'] },
  { deviceId: '0000000000000002', name: '침실 책상 레이더', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_desk_radar', labelOffset: [0, 0.1, 0], kind: 'label', cardDescription: DEVICE_DESCRIPTIONS['2'] },
  { deviceId: '0000000000000003', name: 'Wave Station', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_wave_station', labelOffset: [0, 0.1, 0], kind: 'label', cardDescription: DEVICE_DESCRIPTIONS['3'] },
  { deviceId: '0000000000000004', name: '폰 카메라', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_cam', labelOffset: [0, 0.45, 0], kind: 'label', showInTwin: false, cardDescription: DEVICE_DESCRIPTIONS['4'] },
  { deviceId: '0000000000000005', name: '거실 카메라', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_cam', labelOffset: [0, 0.1, 0], kind: 'label', cardDescription: DEVICE_DESCRIPTIONS['5'] },
  { deviceId: '0000000000000006', name: '플러그1 - 선풍기', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_fan', labelOffset: [0, 0.83, 0], kind: 'fan', pivotNode: 'living_fan_pivot', bladeNode: 'living_fan_blade', cardDescription: DEVICE_DESCRIPTIONS['6'] },
  { deviceId: '0000000000000007', name: '플러그2 - 컴퓨터', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_pc', labelOffset: [0, 0.6, 0], kind: 'plug', cardDescription: DEVICE_DESCRIPTIONS['7'] },
  { deviceId: '0000000000000008', name: '플러그3 - 에어컨', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_ac', labelOffset: [0, 0.22, 0], kind: 'plug', wind: true, windNode: 'bed_ac_outlet_recess', cardDescription: DEVICE_DESCRIPTIONS["8"] },
  { deviceId: '0000000000000009', name: '플러그4 - 인덕션', roomId: '0000000000000003', gltfRoot: 'kitchen_room', anchor: 'kitchen_induction', labelOffset: [0, 0.35, 0], kind: 'induction', glowNode: 'induction_on', cardDescription: DEVICE_DESCRIPTIONS["9"] },
  { deviceId: '000000000000000a', name: '침실 TV', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_desk_tv_screen', labelOffset: [0, 0.38, 0], kind: 'tv', screenNode: 'bed_desk_tv_screen', cardDescription: DEVICE_DESCRIPTIONS['10'] },
  { deviceId: '000000000000000b', name: '침실 조명', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade', lightNode: 'bed_lamp_light', cardDescription: DEVICE_DESCRIPTIONS['11'] },
  { deviceId: '000000000000000c', name: '거실 조명', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade.001', lightNode: 'living_lamp_light', cardDescription: DEVICE_DESCRIPTIONS['12'] },
  { deviceId: '000000000000000d', name: '부엌 조명', roomId: '0000000000000003', gltfRoot: 'kitchen_room', anchor: 'kitchen_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade.002', lightNode: 'kitchen_lamp_light', cardDescription: DEVICE_DESCRIPTIONS['13'] },
];

export const LIVING_CAM_NODE = 'living_cam';

export function twinDevicesForRoom(roomGltfRoot) {
  return TWIN_DEVICES.filter((d) => d.gltfRoot === roomGltfRoot && d.showInTwin !== false);
}

export function twinRoomByGltfRoot(gltfRoot) {
  return TWIN_ROOMS.find((r) => r.gltfRoot === gltfRoot);
}
