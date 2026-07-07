# IoT Control API (가전 제어)

구현된 프론트 코드: `src/api/iotApi.js`(진입점) · `src/api/mock/IotApi.js`(mock) ·
`src/api/v1/IotApi.js`(real).

`src/pages/HomeControlPage.js`(제스처 히스토리/제스처 목록/IoT 상태/전력 분석 4개 탭)와
`src/pages/MainPage.js`의 전력 분석 카드에서 쓰는 제스처 인식, 레이더-제스처 매핑, IoT 기기 제어-제스처
바인딩을 다룬다. **전력 차트·리포트**는 [power.md](./power.md)를 참고한다.

## 공통

- Base URL: `/api/v1`
- 제스처 등록/바인딩/레이더 배정은 현재 세션의 `activeAccount`가 속한 가구 기준으로 조회/수정한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`
- `radars`는 자체 저장소가 없는 파생 리소스다. 레이더 장비 원본(등록/이름변경/삭제/활성화)은
  `settings.md`의 `GET /devices` 하나에만 있고, `GET /iot/radars`는 그중 `class: "srs_r4sn"`인
  장치만 골라 제스처 화면이 쓰기 쉬운 형태로 변환해 보여준다. 레이더 등록/이름 변경/삭제는
  `settings.md`의 `/devices`에서만 하고, 여기서는 별도의 쓰기 API를 두지 않는다.

**Response 409**
```json
{
  "error": {
    "code": "ACTIVE_ACCOUNT_REQUIRED",
    "message": "활성 구성원을 먼저 선택해주세요."
  }
}
```

## 타입

```ts
type GestureHistoryItem = {
  id: string;
  gesture: string;
  device: string;
  action: string;
  occurredAt: string;       // ISO 8601
  confidence: number;       // 0~100
  radarId: string;
  radarName: string;
};

type Gesture = {
  id: string;
  name: string;
  action: string;
};

type GestureSet = {
  id: string;
  name: string;
  description: string;
  gestures: Gesture[];
};

type Radar = {
  id: string;         // settings.md GET /devices의 장치 id와 동일
  name: string;
  roomId: number;      // settings.md GET /rooms의 방 id
  connected: boolean;  // 해당 장치의 enabled 값
};

type DeviceControl = {
  label: string;
  hint: string;             // 안내 문구, 예: "손 올리기 / 손 내리기"
};

type IotDevice = {
  id: string;
  name: string;
  room: string;
  state: string;
  connection: 'online' | 'idle';
  controls: DeviceControl[];
};

type ControlBinding = {
  deviceId: string;
  controlLabel: string;
  gestureId: string | null;
  gestureName: string | null;
  action: string | null;
};

type PowerTrendPoint = { label: string; value: number };

type SmartPlugDevice = {
  id: string;
  name: string;
  room: string;
  summary: string;
  powerW: number;
  voltageV: number;
  currentMa: number;
  switchOn: boolean;
  hourlyCostWon: number;
  trend: {
    hour: PowerTrendPoint[];
    day: PowerTrendPoint[];
    week: PowerTrendPoint[];
    month: PowerTrendPoint[];
  };
};
```

---

## GET `/iot/gestures/today-summary`

`HomeControlPage`의 (전력 분석 탭을 제외한) 요약 카드 "오늘 인식" 값.

**Response 200**
```json
{ "recognizedCount": 18 }
```

## GET `/iot/gestures/history`

"제스처 히스토리" 탭. 최신순으로 반환한다.

**Response 200**
```json
[
  {
    "id": "ges_hist_01J2ZQ8M6R9P4T7X3A5B2C1D0E",
    "gesture": "손 올리기",
    "device": "거실 조명",
    "action": "전원 켜기",
    "occurredAt": "2026-07-02T14:58:00+09:00",
    "confidence": 96,
    "radarId": "8d2e5a1c49f7036b",
    "radarName": "거실 레이더"
  }
]
```

## GET `/iot/gesture-sets`

"제스처 목록" 탭의 세트 카탈로그(Daily Control/수면 모드/집중 모드/휴식 모드). 각 제스처의 레이더 배정은
여기 포함하지 않는다 — `GET /iot/gesture-radar-assignments`로 따로 조회한다.

**Response 200**
```json
[
  {
    "id": "daily",
    "name": "Daily Control",
    "description": "조명, 커튼, 스피커처럼 자주 쓰는 가전을 빠르게 제어합니다.",
    "gestures": [
      { "id": "ges_1", "name": "손 올리기", "action": "조명 켜기" },
      { "id": "ges_2", "name": "손 내리기", "action": "조명 끄기" }
    ]
  }
]
```

## GET `/iot/radars`

제스처 배정 화면에서 고를 수 있는 레이더 목록. `settings.md`의 `GET /devices` 중 `class: "srs_r4sn"`인
장치만 골라 변환한 결과이며, 별도 저장소가 없다 — 레이더를 추가/삭제/비활성화하려면
`settings.md`의 `/devices`를 쓴다.

**Response 200**
```json
[
  { "id": "3a7f2c9d10b4e85f", "name": "침실 하방 레이더", "roomId": 2, "connected": true }
]
```

## GET `/iot/gesture-radar-assignments`

제스처 id → 배정된 레이더 id 목록(레이더 id는 `settings.md`의 장치 id). 배정이 없는 제스처는 응답에
포함되지 않는다.

**Response 200**
```json
{
  "ges_1": ["8d2e5a1c49f7036b"],
  "ges_5": ["8d2e5a1c49f7036b"]
}
```

## PUT `/iot/gesture-radar-assignments/{gestureId}`

한 제스처의 레이더 배정을 통째로 교체한다(다중 선택 토글은 프론트에서 현재 배정 목록을 불러와 넣고 뺀
다음 전체를 다시 보낸다). 빈 배열을 보내면 배정이 없는 상태(응답 map에서 제외)가 된다.

**Request Body**
```json
{ "radarIds": ["8d2e5a1c49f7036b"] }
```

**Response 200**
```json
{ "gestureId": "ges_1", "radarIds": ["8d2e5a1c49f7036b"] }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "제스처를 찾을 수 없습니다." } }
```

## GET `/iot/devices`

"IoT 상태" 탭의 기기 목록. `controls`는 기기별 제어 항목과 안내 문구만 담고, 실제 바인딩된 제스처는
`GET /iot/device-bindings`로 따로 조회한다.

**Response 200**
```json
[
  {
    "id": "light",
    "name": "거실 조명",
    "room": "거실",
    "state": "켜짐 · 밝기 72%",
    "connection": "online",
    "controls": [
      { "label": "전원", "hint": "손 올리기 / 손 내리기" },
      { "label": "밝기 조절", "hint": "위아래 스와이프" },
      { "label": "무드등", "hint": "원 그리기" }
    ]
  }
]
```

## GET `/iot/device-bindings`

전체 기기의 제어-제스처 바인딩 목록. 바인딩되지 않은 제어는 포함하지 않는다.

**Response 200**
```json
[
  { "deviceId": "light", "controlLabel": "전원", "gestureId": "ges_1", "gestureName": "손 올리기", "action": "조명 켜기" }
]
```

## PUT `/iot/device-bindings`

한 기기의 제어 하나에 제스처를 연결(또는 해제)한다. "설정" 팝오버에서 제스처를 고르면 호출한다.

**Request Body** — 연결
```json
{ "deviceId": "light", "controlLabel": "전원", "gestureId": "ges_1" }
```

**Request Body** — 해제
```json
{ "deviceId": "light", "controlLabel": "전원", "gestureId": null }
```

**Response 200**
```json
{ "deviceId": "light", "controlLabel": "전원", "gestureId": "ges_1", "gestureName": "손 올리기", "action": "조명 켜기" }
```

**Response 400**
```json
{ "error": { "code": "GESTURE_IN_USE", "message": "다른 제어에 이미 사용 중인 제스처입니다.", "field": "gestureId" } }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "기기 또는 제스처를 찾을 수 없습니다." } }
```

## DELETE `/iot/device-bindings/{deviceId}`

한 기기의 모든 바인딩을 초기화한다("전체 초기화" 버튼).

**Response 200**
```json
{ "deviceId": "light" }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "기기를 찾을 수 없습니다." } }
```

## GET `/iot/power/plugs`

"전력 분석" 탭과 대시보드 전력 카드에서 공용으로 쓰는 스마트 플러그 목록(선택한 카드 기준으로 프론트가
차트를 바꿔 그린다). `id: "all"`은 전체 콘센트 합산 카드다.

**Response 200**
```json
[
  {
    "id": "all",
    "name": "전체",
    "room": "전체 콘센트",
    "summary": "대기 전력이 낮고 TV 콘센트만 짧게 상승했습니다.",
    "powerW": 67.4,
    "voltageV": 235.0,
    "currentMa": 286.7,
    "switchOn": true,
    "hourlyCostWon": 7.4,
    "trend": {
      "hour": [{ "label": "00:00", "value": 42 }],
      "day": [{ "label": "월", "value": 1.4 }],
      "week": [{ "label": "1주", "value": 13.2 }],
      "month": [{ "label": "3월", "value": 46 }]
    }
  }
]
```

---

## 전체 엔드포인트 요약

```http
GET    /api/v1/iot/gestures/today-summary
GET    /api/v1/iot/gestures/history

GET    /api/v1/iot/gesture-sets
GET    /api/v1/iot/radars
GET    /api/v1/iot/gesture-radar-assignments
PUT    /api/v1/iot/gesture-radar-assignments/{gestureId}

GET    /api/v1/iot/devices
GET    /api/v1/iot/device-bindings
PUT    /api/v1/iot/device-bindings
DELETE /api/v1/iot/device-bindings/{deviceId}

GET    /api/v1/iot/power/plugs
```

## 프론트 API 메서드 시그니처 (구현 예정)

```js
iotApi.getTodayGestureSummary()
iotApi.getGestureHistory()

iotApi.getGestureSets()
iotApi.getRadars()
iotApi.getGestureRadarAssignments()
iotApi.updateGestureRadarAssignment(gestureId, radarIds)

iotApi.getDevices()
iotApi.getDeviceBindings()
iotApi.setDeviceBinding({ deviceId, controlLabel, gestureId })
iotApi.clearDeviceBindings(deviceId)

iotApi.getPowerPlugs()
```

## 프론트 연동 지점 (구현 예정)

- `src/pages/HomeControlPage.js` → 위 엔드포인트 전부(탭 4개: 제스처 히스토리/제스처 목록/IoT 상태/전력 분석)
- `src/pages/MainPage.js` → `/iot/power/plugs`(대시보드 전력 분석 카드)
- Mock 시드 데이터: `src/data/homeData.js`(레이더 제외), 레이더는 `src/api/mock/devicesStore.js`
  (`settings.md`의 mock과 공유하는 room/device 원본 저장소)에서 파생한다.
