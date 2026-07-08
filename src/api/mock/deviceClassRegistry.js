// Static per-class capability registry — mirrors the shape of the real
// device.h Queryable/Actionable model (src/wave-server/device/device.h) so
// that once the backend exposes GET /devices/:id/capabilities, this file can
// be deleted and the API response consumed directly instead.
//
// `attributes` values match device.h's Action::Attribute enum names exactly
// (Toggle / Repeat / Momentary / Stateful) — see philips_wiz_e29.h's doc
// comment block for the canonical JSON shape this was copied from.
//
// `panel` selects which component in pages/iot/panels renders the "제어" tab.
// `triggerKinds` lists which Trigger.kind values this class can produce.

const on = { name: 'on', attributes: ['Stateful'], description: '전원 켜기', paramsSchema: {} };
const off = { name: 'off', attributes: ['Stateful'], description: '전원 끄기', paramsSchema: {} };
const toggle = { name: 'toggle', attributes: ['Toggle', 'Stateful'], description: '전원 상태 토글', paramsSchema: {} };

export const deviceClassRegistry = {
  srs_r4sn: {
    label: 'mmWave 레이더',
    panel: 'radar',
    triggerKinds: ['gesture'],
    actions: [],
    queries: [],
  },

  wave_station: {
    label: 'Wave Station',
    panel: 'wave_station',
    triggerKinds: ['ir_recv'],
    actions: [
      {
        name: 'send_ir',
        attributes: ['Repeat'],
        description: '등록된 IR 커맨드 전송',
        paramsSchema: { type: 'object', properties: { commandId: { type: 'string' } }, required: ['commandId'] },
      },
    ],
    queries: [
      { name: 'mic_level', description: '마이크 입력 레벨(0~1)' },
      { name: 'env', description: '조도/온습도 스냅샷' },
    ],
  },

  droid_cam: {
    label: '폰 카메라',
    panel: 'camera',
    triggerKinds: [],
    actions: [],
    queries: [
      { name: 'stream', description: 'MJPEG 스트림 URI' },
      { name: 'mic_level', description: '마이크 입력 레벨(0~1)' },
    ],
    ptz: false,
  },

  reolink_e1_pro: {
    label: 'IoT 카메라',
    panel: 'camera',
    // Sound/voice/vision triggers are on the product roadmap but not wired
    // into a rule-matchable event yet — kept out of `triggerKinds` for now
    // so the rule editor doesn't offer a trigger type that can't fire.
    triggerKinds: [],
    actions: [],
    queries: [
      { name: 'stream', description: 'RTSP 스트림 URI(go2rtc)' },
      { name: 'mic_level', description: '마이크 입력 레벨(0~1)' },
    ],
    ptz: true,
  },

  tuya_ep2h: {
    label: '스마트 플러그',
    panel: 'plug',
    triggerKinds: ['device_state'],
    actions: [on, off, toggle],
    queries: [
      { name: 'switch', description: '현재 on/off 상태' },
      { name: 'voltage', description: 'AC 전압(V)' },
      { name: 'current', description: '전류(mA)' },
      { name: 'power', description: '순간 전력(W)' },
      { name: 'energy', description: '누적 에너지(kWh)' },
      { name: 'status', description: '전체 datapoint' },
    ],
    // Queries usable as a device_state trigger's `query` field.
    triggerableQueries: ['power', 'voltage', 'current'],
  },

  samsung_g7: {
    label: 'Samsung TV',
    panel: 'tv',
    triggerKinds: [],
    actions: [
      on, off, toggle,
      { name: 'volume_up', attributes: ['Repeat'], description: '볼륨 올리기', paramsSchema: {} },
      { name: 'volume_down', attributes: ['Repeat'], description: '볼륨 내리기', paramsSchema: {} },
      { name: 'mute', attributes: ['Toggle', 'Stateful'], description: '음소거 토글', paramsSchema: {} },
      { name: 'channel_up', attributes: ['Repeat'], description: '채널 올리기', paramsSchema: {} },
      { name: 'channel_down', attributes: ['Repeat'], description: '채널 내리기', paramsSchema: {} },
      {
        name: 'open_app',
        attributes: [],
        description: '앱 실행',
        paramsSchema: { type: 'object', properties: { app: { type: 'string', enum: ['youtube', 'netflix', 'samsung_tv_plus', 'prime_video'] } }, required: ['app'] },
      },
      { name: 'nav_up', attributes: [], description: '방향 위', paramsSchema: {} },
      { name: 'nav_down', attributes: [], description: '방향 아래', paramsSchema: {} },
      { name: 'nav_left', attributes: [], description: '방향 왼쪽', paramsSchema: {} },
      { name: 'nav_right', attributes: [], description: '방향 오른쪽', paramsSchema: {} },
      { name: 'select', attributes: [], description: '선택(OK)', paramsSchema: {} },
      { name: 'back', attributes: [], description: '뒤로가기', paramsSchema: {} },
      { name: 'play_pause', attributes: [], description: '재생/일시정지', paramsSchema: {} },
      { name: 'home', attributes: [], description: '홈 화면', paramsSchema: {} },
      { name: 'input_source', attributes: [], description: '외부 입력 전환', paramsSchema: {} },
    ],
    queries: [{ name: 'state', description: '전원/볼륨/채널/실행 앱 상태' }],
  },

  tizen_tv: {
    label: 'Tizen TV',
    panel: 'tv',
    triggerKinds: [],
    actions: [
      on, off, toggle,
      { name: 'volume_up', attributes: ['Repeat'], description: '볼륨 올리기', paramsSchema: {} },
      { name: 'volume_down', attributes: ['Repeat'], description: '볼륨 내리기', paramsSchema: {} },
      { name: 'mute', attributes: ['Toggle', 'Stateful'], description: '음소거 토글', paramsSchema: {} },
      { name: 'channel_up', attributes: ['Repeat'], description: '채널 올리기', paramsSchema: {} },
      { name: 'channel_down', attributes: ['Repeat'], description: '채널 내리기', paramsSchema: {} },
      {
        name: 'open_app',
        attributes: [],
        description: '앱 실행',
        paramsSchema: { type: 'object', properties: { app: { type: 'string', enum: ['youtube', 'netflix', 'samsung_tv_plus', 'prime_video'] } }, required: ['app'] },
      },
      // Remote-control navigation — Tizen TVs don't expose these as separate
      // Actionable entries on the real device yet, so these are dummy
      // one-shot actions kept only so the on-screen remote stays fully
      // interactive (they log an event but don't change queryable state).
      { name: 'nav_up', attributes: [], description: '방향 위', paramsSchema: {} },
      { name: 'nav_down', attributes: [], description: '방향 아래', paramsSchema: {} },
      { name: 'nav_left', attributes: [], description: '방향 왼쪽', paramsSchema: {} },
      { name: 'nav_right', attributes: [], description: '방향 오른쪽', paramsSchema: {} },
      { name: 'select', attributes: [], description: '선택(OK)', paramsSchema: {} },
      { name: 'back', attributes: [], description: '뒤로가기', paramsSchema: {} },
      { name: 'play_pause', attributes: [], description: '재생/일시정지', paramsSchema: {} },
      { name: 'home', attributes: [], description: '홈 화면', paramsSchema: {} },
      { name: 'input_source', attributes: [], description: '외부 입력 전환', paramsSchema: {} },
    ],
    queries: [{ name: 'state', description: '전원/볼륨/채널/실행 앱 상태' }],
  },

  philips_wiz_e29_color: {
    label: 'WiZ 컬러 조명',
    panel: 'light',
    triggerKinds: [],
    capabilities: { dimming: true, color: true, tunableWhite: true, tempMinK: 2200, tempMaxK: 6500 },
    actions: [
      on, off, toggle,
      { name: 'brightness', attributes: ['Stateful'], description: '밝기 설정(10-100)', paramsSchema: { type: 'object', properties: { value: { type: 'integer', min: 10, max: 100 } }, required: ['value'] } },
      { name: 'color', attributes: ['Stateful'], description: 'RGB 색상 설정', paramsSchema: { type: 'object', properties: { r: { type: 'integer', min: 0, max: 255 }, g: { type: 'integer', min: 0, max: 255 }, b: { type: 'integer', min: 0, max: 255 } }, required: ['r', 'g', 'b'] } },
      { name: 'temperature', attributes: ['Stateful'], description: '색온도 설정(K)', paramsSchema: { type: 'object', properties: { value: { type: 'integer', min: 2200, max: 6500 } }, required: ['value'] } },
    ],
    queries: [
      { name: 'capabilities', description: '프로브된 하드웨어 기능' },
      { name: 'state', description: '전원/밝기' },
      { name: 'brightness', description: '밝기(%)' },
      { name: 'color', description: '현재 RGB' },
      { name: 'temperature', description: '현재 색온도(K)' },
      { name: 'status', description: '전체 pilot 필드' },
    ],
  },

  philips_wiz_e29_white: {
    label: 'WiZ 화이트 조명',
    panel: 'light',
    triggerKinds: [],
    capabilities: { dimming: true, color: false, tunableWhite: true, tempMinK: 2200, tempMaxK: 6500 },
    actions: [
      on, off, toggle,
      { name: 'brightness', attributes: ['Stateful'], description: '밝기 설정(10-100)', paramsSchema: { type: 'object', properties: { value: { type: 'integer', min: 10, max: 100 } }, required: ['value'] } },
      { name: 'temperature', attributes: ['Stateful'], description: '색온도 설정(K)', paramsSchema: { type: 'object', properties: { value: { type: 'integer', min: 2200, max: 6500 } }, required: ['value'] } },
    ],
    queries: [
      { name: 'capabilities', description: '프로브된 하드웨어 기능' },
      { name: 'state', description: '전원/밝기' },
      { name: 'brightness', description: '밝기(%)' },
      { name: 'temperature', description: '현재 색온도(K)' },
      { name: 'status', description: '전체 pilot 필드' },
    ],
  },
};

export function getClassInfo(deviceClass) {
  return deviceClassRegistry[deviceClass] || { label: deviceClass, panel: 'unknown', triggerKinds: [], actions: [], queries: [] };
}

export function findAction(deviceClass, actionName) {
  return getClassInfo(deviceClass).actions.find((a) => a.name === actionName) || null;
}
