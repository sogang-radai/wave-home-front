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
 * @type {Array<{ deviceId: string, name: string, roomId: string, gltfRoot: string, anchor: string, kind: TwinVisualKind, labelOffset?: number[], shadeNode?: string, pivotNode?: string, glowNode?: string, bladeNode?: string, screenNode?: string, wind?: boolean, windNode?: string, showInTwin?: boolean }>}
 */
export const TWIN_DEVICES = [
  { deviceId: '0000000000000001', name: '침실 하방 레이더', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_downward_radar', labelOffset: [0, 0.1, -0.06], kind: 'label' },
  { deviceId: '0000000000000002', name: '침실 책상 레이더', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_desk_radar', labelOffset: [0, 0.1, 0], kind: 'label' },
  { deviceId: '0000000000000003', name: 'Wave Station', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_wave_station', labelOffset: [0, 0.1, 0], kind: 'label' },
  { deviceId: '0000000000000004', name: '폰 카메라', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_cam', labelOffset: [0, 0.45, 0], kind: 'label', showInTwin: false },
  { deviceId: '0000000000000005', name: '거실 카메라', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_cam', labelOffset: [0, 0.1, 0], kind: 'label' },
  { deviceId: '0000000000000006', name: '플러그1 - 선풍기', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_fan', labelOffset: [0, 0.83, 0], kind: 'fan', pivotNode: 'living_fan_pivot', bladeNode: 'living_fan_blade' },
  { deviceId: '0000000000000007', name: '플러그2 - 컴퓨터', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_pc', labelOffset: [0, 0.6, 0], kind: 'plug' },
  { deviceId: '0000000000000008', name: '플러그3 - 에어컨', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_ac', labelOffset: [0, 0.22, 0], kind: 'plug', wind: true, windNode: 'bed_ac_outlet_recess' },
  { deviceId: '0000000000000009', name: '플러그4 - 인덕션', roomId: '0000000000000003', gltfRoot: 'kitchen_room', anchor: 'kitchen_induction', labelOffset: [0, 0.35, 0], kind: 'induction', glowNode: 'induction_on' },
  { deviceId: '000000000000000a', name: '침실 TV', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_desk_tv_screen', labelOffset: [0, 0.38, 0], kind: 'tv', screenNode: 'bed_desk_tv_screen' },
  { deviceId: '000000000000000b', name: '침실 조명', roomId: '0000000000000002', gltfRoot: 'bed_room', anchor: 'bed_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade', lightNode: 'bed_lamp_light' },
  { deviceId: '000000000000000c', name: '거실 조명', roomId: '0000000000000001', gltfRoot: 'living_room', anchor: 'living_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade.001', lightNode: 'living_lamp_light' },
  { deviceId: '000000000000000d', name: '부엌 조명', roomId: '0000000000000003', gltfRoot: 'kitchen_room', anchor: 'kitchen_lamp', labelOffset: [0, 1.6, 0], kind: 'light', shadeNode: 'lamp_shade.002', lightNode: 'kitchen_lamp_light' },
];

export const LIVING_CAM_NODE = 'living_cam';

export function twinDevicesForRoom(roomGltfRoot) {
  return TWIN_DEVICES.filter((d) => d.gltfRoot === roomGltfRoot && d.showInTwin !== false);
}

export function twinRoomByGltfRoot(gltfRoot) {
  return TWIN_ROOMS.find((r) => r.gltfRoot === gltfRoot);
}
