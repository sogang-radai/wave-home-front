# Settings API (설정)

구현된 프론트 코드: `src/api/settingsApi.js` · `src/api/mock/SettingsApi.js` ·
`src/api/v1/SettingsApi.js`. 아직 클래스는 없고, 이 문서가 그 클래스들의 메서드 시그니처 계약이다.

가구 구성원(계정), 세션의 활성 구성원, 방/구역, 기기, 수면 설정, 일반 설정, 알림까지 "설정" 화면
(`src/pages/settings/*`)에서 쓰는 리소스를 다룬다. 알림은 헤더/사이드바 전역 기능이라 별도 도메인이
없어 여기에 넣었다.

## 공통

- Base URL: `/api/v1`
- 인증: 복잡한 OAuth/JWT/비밀번호 로그인은 전제하지 않는다. 서버 세션 쿠키(`sid`)로 현재 브라우저/기기의 활성 구성원만 기억한다.
- 활성 가구 구성원 기준으로 동작하는 엔드포인트(수면/일반 설정/개인 알림 등)는 path나 body에 별도
  `accountId`를 넣지 않고 세션의 `activeAccount`를 기준으로 동작한다.
- ID는 DB INTEGER `id`를 JSON number로 그대로 노출한다.
  구성원·방·할일·대화·알림·룰·IR·이벤트 등 대부분의 리소스가 해당한다.
- **예외**: `device.id`는 16자 hex 등 물리 장비 식별 **문자열**. AI 모델 카탈로그 id(`gemini-flash2.5` 등)도 문자열.
- **방 정렬 순서**는 서버에 저장하지 않는다. 프론트 `localStorage`(`wavehome_room_order`)에만 둔다.
- 설정 폼 중심 API는 JS/React 연동 편의를 위해 camelCase를 기본으로 한다. 단, `/devices`는 실제 장비
  설정 포맷을 그대로 반영해 `input_devices`, `room_id`, `class`, `interface` 같은 snake_case 필드를 쓴다.
- DELETE 성공 응답은 프론트 처리 편의를 위해 `200 OK`와 삭제된 ID를 반환하는 방식으로 통일한다.
- 공통 에러 응답:
  ```json
  { "error": { "code": "NOT_FOUND", "message": "리소스를 찾을 수 없습니다." } }
  ```
- validation 에러는 가능하면 `field` 또는 `details`를 포함한다.
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "입력값을 확인해주세요.",
      "details": [
        {
          "field": "acTemp",
          "code": "OUT_OF_RANGE",
          "message": "온도는 20~28 사이여야 합니다."
        }
      ]
    }
  }
  ```

---

## 세션 (Session)

사이드바/설정에서 선택한 활성 구성원을 서버 세션에 저장한다. 처음 접속했는데 활성 구성원이 없다면 서버는 첫 번째 구성원을 기본 선택한다.

### GET `/session`

현재 브라우저/기기의 활성 구성원을 조회한다. 새로고침 후 프론트 초기 상태 복원에 사용한다.

**Response 200**
```json
{
  "activeAccount": {
    "id": 1,
    "name": "김건강"
  }
}
```

### PATCH `/session/active-account`

사이드바/설정에서 활성 구성원을 전환한다.

**Request Body**
```json
{ "accountId": 2 }
```

**Response 200**
```json
{
  "activeAccount": {
    "id": 2,
    "name": "박웰빙"
  }
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "구성원을 찾을 수 없습니다." } }
```

---

## 가구 구성원 (Accounts)

`src/pages/settings/AccountSettings.js`, `PersonalSettings.js`가 사용.

### GET `/accounts`
**Response 200**
```json
[
  { "id": 1, "name": "김건강" },
  { "id": 2, "name": "박웰빙" }
]
```

### POST `/accounts`

새 가구 구성원 추가 ("멤버 추가" 버튼). ID는 서버가 생성한다.

**Request Body**
```json
{ "name": "이건강" }
```

**Response 201**
```json
{ "id": 3, "name": "이건강" }
```

**Response 400** (이름을 입력 안하면 버튼이 활성화되지 않도록 막아놓을 거긴 함.)
```json
{ "error": { "code": "INVALID_NAME", "message": "이름을 입력해주세요.", "field": "name" } }
```

### PATCH `/accounts/{accountId}`

구성원 이름 변경. "개인 설정" 화면의 저장 버튼과 "설정 > 계정"에서 공용으로 쓴다.

**Request Body**
```json
{ "name": "김건강2" }
```

**Response 200**
```json
{ "id": 1, "name": "김건강2" }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "구성원을 찾을 수 없습니다." } }
```

---

## 방 / 구역 (Rooms)

`src/pages/settings/DeviceSettings.js`의 `RoomZoneSettings`가 사용. 기기 등록 화면에서 방 이름을
조회하는 데도 재사용된다. 방은 설정값이 아니라 독립 리소스이므로 `/settings/rooms`가 아닌 `/rooms`를 쓴다.

### GET `/rooms`
**Response 200**
```json
[
  {
    "id": 1,
    "name": "책상",
    "description": "1인 업무 공간"
  },
  {
    "id": 2,
    "name": "침실",
    "description": "취침 공간"
  }
]
```

### POST `/rooms`
**Request Body**
```json
{ "name": "거실", "description": "" }
```
`description`이 빈 문자열이면 서버가 `name`으로 채운다.

**Response 201**
```json
{
  "id": 4,
  "name": "거실",
  "description": "거실"
}
```

**Response 400**
```json
{ "error": { "code": "INVALID_NAME", "message": "방 이름을 입력해주세요.", "field": "name" } }
```

### PATCH `/rooms/{roomId}`

방 이름/설명을 수정한다.

**Request Body**
```json
{ "name": "안방", "description": "취침 공간" }
```

**Response 200**
```json
{
  "id": 2,
  "name": "안방",
  "description": "취침 공간"
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "방을 찾을 수 없습니다." } }
```

### DELETE `/rooms/{roomId}`

방에 연결된 기기가 있으면 삭제하지 않는다. 사용자는 먼저 기기를 다른 방으로 옮기거나 삭제해야 한다.

**Response 200**
```json
{ "id": 4 }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "방을 찾을 수 없습니다." } }
```

**Response 409**
```json
{
  "error": {
    "code": "ROOM_HAS_DEVICES",
    "message": "이 방에 연결된 기기가 있어 삭제할 수 없습니다."
  }
}
```

---

## 기기 (Devices)

`src/pages/settings/DeviceSettings.js`의 `DeviceRegistrationSettings`가 사용. 입력 장치(레이더/마이크/
카메라)와 출력 장치(리모컨/TV/플러그/조명)를 한 번에 내려준다. 기기는 설정값이 아니라 독립 리소스이므로
`/settings/devices`가 아닌 `/devices`를 쓴다.

이 엔드포인트는 실제 장비 설정 포맷을 그대로 내려주므로 다른 설정 API와 달리 snake_case를 유지한다.
`class`도 백엔드 장비 클래스명과 맞추기 위해 그대로 쓴다. 프론트 내부에서 camelCase가 필요하면
`SettingsApi` 구현체에서 별도 view model로 변환한다.

레이더 장비 원본은 여기(`class: "srs_r4sn"`)에만 있다. `home.md`의 `GET /home/radars`는 이 목록에서
파생된 읽기 전용 뷰이며 별도로 저장하지 않는다 — 레이더 등록/이름변경/삭제/활성화는 전부 이 `/devices`
엔드포인트로만 한다.

```ts
type Device = {
  id: string;
  room_id: number | null;
  name: string;
  description: string;
  enabled: boolean;
  class:
    | 'srs_r4sn'
    | 'wave_mic'
    | 'wave_cam'
    | 'ir_reciever'
    | 'ir_remote'
    | 'tizen_tv'
    | 'tuya_ep2h'
    | 'tuya_blind'
    | 'hue_light';
  interface: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

type DevicesResponse = {
  input_devices: Device[];
  output_devices: Device[];
};
```

### GET `/devices`
**Response 200**
```json
{
  "input_devices": [
    {
      "id": "8d2e5a1c49f7036b",
      "room_id": 1,
      "name": "거실 레이더",
      "description": "SRS R4SN mmWave 레이더",
      "enabled": true,
      "class": "srs_r4sn",
      "interface": {
        "host": "192.168.0.33",
        "point_cloud": {
          "enabled": true,
          "port": 29172
        },
        "iq": {
          "enabled": true,
          "port": 29171
        }
      },
      "settings": {
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
      "id": "1a6f3e8d02c75491",
      "room_id": 2,
      "name": "침실 마이크",
      "description": "ESP32 + INMP441, 16kHz 16bit mono",
      "enabled": true,
      "class": "wave_mic",
      "interface": {
        "host": "192.168.0.50",
        "port": 8765
      },
      "settings": {
        "sample_rate": 16000,
        "sample_size": 16,
        "channels": 1
      }
    },
    {
      "id": "6b904f2e17d83ac5",
      "room_id": 1,
      "name": "거실 카메라",
      "description": "USB Wave Camera",
      "enabled": true,
      "class": "wave_cam",
      "interface": {
        "transport": "usb",
        "backend": "v4l2",
        "device": "/dev/video0"
      }
    },
    {
      "id": "c5281a7e93bf406d",
      "room_id": 2,
      "name": "침실 카메라",
      "description": "Network Wave Camera",
      "enabled": true,
      "class": "wave_cam",
      "interface": {
        "transport": "tcp",
        "backend": "droidcam",
        "host": "192.168.0.51",
        "port": 4747
      }
    },
    {
      "id": "2e8d1795c0463f5a",
      "room_id": 1,
      "name": "IR 수신기",
      "description": "LIRC IR 수신",
      "enabled": true,
      "class": "ir_reciever",
      "interface": {
        "transport": "lirc",
        "device": "/dev/lirc0"
      }
    }
  ],
  "output_devices": [
    {
      "id": "9a4c71e36b0285fd",
      "room_id": 1,
      "name": "거실 스마트 플러그",
      "description": "EP2H Tuya IoT 플러그",
      "enabled": true,
      "class": "tuya_ep2h",
      "interface": {
        "host": "192.168.0.37",
        "device_id": "eb61aa6ce49add5d80yfcj",
        "local_key": "s^q2?;Ur|q{SlG(>",
        "version": "3.3"
      }
    },
    {
      "id": "5e3b80a1f2496cde",
      "room_id": 1,
      "name": "거실 TV",
      "description": "삼성 32인치 TV",
      "enabled": true,
      "class": "tizen_tv",
      "interface": {
        "host": "192.168.0.70",
        "port": 8002,
        "name": "WaveHome-TV"
      }
    },
    {
      "id": "0f8c2d6b147ae953",
      "room_id": 1,
      "name": "거실 에어컨 IR",
      "description": "LIRC IR 송신, 에어컨 제어",
      "enabled": true,
      "class": "ir_remote",
      "interface": {
        "transport": "lirc",
        "device": "/dev/lirc1",
        "command_list": "./ir/ac_commands.txt"
      }
    },
    {
      "id": "d7139e58a04b6c21",
      "room_id": 2,
      "name": "침실 조명",
      "description": "Philips Hue 전구",
      "enabled": true,
      "class": "hue_light",
      "interface": {
        "bridge_host": "192.168.0.80",
        "username": "hue-bridge-api-key-placeholder",
        "light_id": 1
      }
    },
    {
      "id": "4b2a90e7c1586d3f",
      "room_id": 2,
      "name": "침실 블라인드",
      "description": "Tuya 스마트 블라인드",
      "enabled": false,
      "class": "tuya_blind",
      "interface": {
        "host": "192.168.0.61",
        "device_id": "bfabcdef12345678",
        "local_key": "f0e1d2c3b4a59687",
        "version": "3.3"
      }
    }
  ]
}
```

### POST `/devices`

기기를 등록한다. `enabled` 기본값은 `true`다. 요청 body도 GET 응답과 같은 장비 설정 포맷을 따른다.

**Request Body**
```json
{
  "room_id": 1,
  "name": "거실 에어컨 IR",
  "description": "LIRC IR 송신, 에어컨 제어",
  "enabled": true,
  "class": "ir_remote",
  "interface": {
    "transport": "lirc",
    "device": "/dev/lirc1",
    "command_list": "./ir/ac_commands.txt"
  }
}
```

**Response 201**
```json
{
  "id": "0f8c2d6b147ae953",
  "room_id": 1,
  "name": "거실 에어컨 IR",
  "description": "LIRC IR 송신, 에어컨 제어",
  "enabled": true,
  "class": "ir_remote",
  "interface": {
    "transport": "lirc",
    "device": "/dev/lirc1",
    "command_list": "./ir/ac_commands.txt"
  }
}
```

### PATCH `/devices/{deviceId}`

기기 일반 수정 API. 켜기/끄기 토글뿐 아니라 이름, 방, 설명, `interface`, `settings`도 같은 엔드포인트로
부분 수정한다.

**Request Body**
```json
{
  "enabled": false,
  "name": "거실 에어컨 IR",
  "room_id": 1
}
```

**Response 200**
```json
{
  "id": "0f8c2d6b147ae953",
  "room_id": 1,
  "name": "거실 에어컨 IR",
  "description": "LIRC IR 송신, 에어컨 제어",
  "enabled": false,
  "class": "ir_remote",
  "interface": {
    "transport": "lirc",
    "device": "/dev/lirc1",
    "command_list": "./ir/ac_commands.txt"
  }
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "기기를 찾을 수 없습니다." } }
```

### DELETE `/devices/{deviceId}`
**Response 200**
```json
{ "id": "0f8c2d6b147ae953" }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "기기를 찾을 수 없습니다." } }
```

---

## 수면 설정 (Sleep config)

`src/pages/settings/SleepSettings.js`가 사용. 수면 **트래킹/리포트**는 `sleep.md` 도메인이고, 이건
취침 전 자동화 설정이다. 활성 구성원 기준으로 조회/저장한다.

```ts
type SleepConfig = {
  bedtime: string;              // 'HH:MM'
  wakeTime: string;             // 'HH:MM'
  wakeUpSound: string;          // sound id, GET /settings/sounds 참고
  acAuto: boolean;
  acTemp: number;               // 20~28
  lightAuto: boolean;
  dimStartMinutes: number;      // 취침 몇 분 전부터 조명 낮출지, 10~60
  finalBrightness: number;      // 최종 밝기 %, 0~30
  wakeLightRamp: boolean;       // 기상 30분 전 조명 서서히 밝히기
  wakeMusic: boolean;           // 기상 15분 전 음악/라디오 재생
  wakeTvOrAlarm: boolean;       // 기상 시간 TV 켜기 / 알람
};
```

### GET `/settings/sleep`
**Response 200**
```json
{
  "bedtime": "23:30",
  "wakeTime": "07:00",
  "wakeUpSound": "love-yourself",
  "acAuto": true,
  "acTemp": 24,
  "lightAuto": true,
  "dimStartMinutes": 30,
  "finalBrightness": 10,
  "wakeLightRamp": true,
  "wakeMusic": true,
  "wakeTvOrAlarm": false
}
```

### PUT `/settings/sleep`
**Request Body** — `SleepConfig` 전체
```json
{
  "bedtime": "23:00",
  "wakeTime": "06:30",
  "wakeUpSound": "sign-of-the-times",
  "acAuto": true,
  "acTemp": 23,
  "lightAuto": false,
  "dimStartMinutes": 20,
  "finalBrightness": 15,
  "wakeLightRamp": true,
  "wakeMusic": false,
  "wakeTvOrAlarm": true
}
```

**Response 200** — 저장된 `SleepConfig`
```json
{
  "bedtime": "23:00",
  "wakeTime": "06:30",
  "wakeUpSound": "sign-of-the-times",
  "acAuto": true,
  "acTemp": 23,
  "lightAuto": false,
  "dimStartMinutes": 20,
  "finalBrightness": 15,
  "wakeLightRamp": true,
  "wakeMusic": false,
  "wakeTvOrAlarm": true
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_TIME_RANGE",
    "message": "취침 시간과 기상 시간을 확인해주세요.",
    "field": "bedtime"
  }
}
```

---

## 일반 설정 (General)

`src/pages/settings/GeneralSettings.js`가 사용. 활성 구성원 기준으로 조회/저장한다.

### GET `/settings/general`
**Response 200**
```json
{
  "theme": "light",
  "language": "ko",
  "notificationSound": "sign-of-the-times",
  "ttsSpeakerId": 0,
  "ttsPlaybackSpeed": 1.0,
  "browserPushEnabled": false
}
```

`browserPushEnabled`가 `true`이면 프론트가 Web Push 구독을 등록하고 `PUT /push/subscription`으로
endpoint·키를 서버에 저장한다. 백엔드는 저장된 구독으로 `/api/push/send`(wave-server)에서
VAPID 서명 후 브라우저 푸시를 발송한다.

### PUT `/settings/general`
**Request Body**
```json
{
  "theme": "dark",
  "language": "en",
  "notificationSound": "love-yourself",
  "ttsSpeakerId": 4
}
```

**Response 200** — 저장된 설정 (요청 바디와 동일 shape)
```json
{
  "theme": "dark",
  "language": "en",
  "notificationSound": "love-yourself",
  "ttsSpeakerId": 4
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_SPEAKER",
    "message": "존재하지 않는 TTS 스피커입니다.",
    "field": "ttsSpeakerId"
  }
}
```

### GET `/settings/sounds`
수면 설정(`wakeUpSound`)과 일반 설정(`notificationSound`)이 공유하는 알람음 목록.

**Response 200**
```json
[
  { "id": "sign-of-the-times", "label": "Sign of the Times" },
  { "id": "love-yourself", "label": "Love Yourself" }
]
```

### GET `/settings/tts-speakers`
**Response 200**
```json
[
  { "id": 0, "name": "지우", "description": "차분한 여성 목소리", "character": "wave", "gender": "female" },
  { "id": 1, "name": "도윤", "description": "안정적인 남성 목소리", "character": "wave", "gender": "male" }
]
```

---

## 개인 설정 (Personal)

`src/pages/settings/PersonalSettings.js`는 별도 엔드포인트가 없다. 이름 변경은 위
`PATCH /accounts/{accountId}`를 그대로 재사용한다.

---

## 브라우저 푸시 (Web Push)

`src/push/browserPush.js` · `public/push-sw.js` · `src/api/pushApi.js`

활성 세션(구성원) 기준으로 Push 구독을 저장한다. wave-server의 `PushNotificationController`
(`/api/push/send`)가 VAPID 서명 후 구독 endpoint로 발송한다.

```ts
type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
};
```

### GET `/push/vapid-public-key`
**Response 200**
```json
{ "publicKey": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" }
```

### PUT `/push/subscription`
**Request Body** — `PushSubscription` (브라우저 `PushSubscription.toJSON()` 결과)

**Response 200**
```json
{ "ok": true }
```

### DELETE `/push/subscription`
구독 해제. Request Body 없음.

**Response 200**
```json
{ "ok": true }
```

푸시 페이로드 예시 (service worker `push` 이벤트):
```json
{
  "title": "WaveAI 건강 브리핑",
  "body": "수면 중 심한 코골이가 감지되어 가습기를 가동했습니다.",
  "url": "/chat"
}
```

---

## 공통 · 알림 (Notifications)

사이드바/탑바 종 아이콘 드롭다운(`src/App.js`의 `notifications`)이 사용. 알림은 현재 정책상
활성 구성원 기준이다. 가구 전체 알림으로 바꿀 경우 응답에 `accountId`를 추가한다.

```ts
type Notification = {
  id: number;
  type: 'timer' | 'sleep' | 'posture' | 'temperature';
  message: string;
  createdAt: string; // ISO 8601, 예: '2026-07-02T07:12:00+09:00'
  read: boolean;
};
```

### GET `/notifications`
**Response 200**
```json
[
  {
    "id": 1,
    "type": "timer",
    "message": "착석 1시간 48분 경과 — 스트레칭을 해보세요",
    "createdAt": "2026-07-02T07:10:00+09:00",
    "read": false
  },
  {
    "id": 2,
    "type": "sleep",
    "message": "오늘 수면 목표까지 30분 부족합니다",
    "createdAt": "2026-07-02T07:12:00+09:00",
    "read": false
  }
]
```

### PATCH `/notifications/read-all`

"모두 읽음" 처리. 현재 프론트 메서드명(`markAllNotificationsRead`)과 맞춰 이 경로를 유지한다.

**Request Body** 없음

**Response 200** — 갱신된 전체 목록 (모든 `read: true`)
```json
[
  {
    "id": 1,
    "type": "timer",
    "message": "착석 1시간 48분 경과 — 스트레칭을 해보세요",
    "createdAt": "2026-07-02T07:10:00+09:00",
    "read": true
  }
]
```

---

## 전체 엔드포인트 요약

```http
GET    /api/v1/session
PATCH  /api/v1/session/active-account

GET    /api/v1/accounts
POST   /api/v1/accounts
PATCH  /api/v1/accounts/{accountId}
DELETE /api/v1/accounts/{accountId}

GET    /api/v1/rooms
POST   /api/v1/rooms
PATCH  /api/v1/rooms/{roomId}
DELETE /api/v1/rooms/{roomId}
PUT    /api/v1/rooms/order
GET    /api/v1/rooms/{roomId}/members
PUT    /api/v1/rooms/{roomId}/members

GET    /api/v1/devices
POST   /api/v1/devices
PATCH  /api/v1/devices/{deviceId}
DELETE /api/v1/devices/{deviceId}
PUT    /api/v1/devices/{deviceId}/room
DELETE /api/v1/devices/{deviceId}/room

GET    /api/v1/settings/sleep
PUT    /api/v1/settings/sleep

GET    /api/v1/settings/general
PUT    /api/v1/settings/general
GET    /api/v1/push/vapid-public-key
PUT    /api/v1/push/subscription
DELETE /api/v1/push/subscription

GET    /api/v1/settings/sounds
GET    /api/v1/settings/tts-speakers

GET    /api/v1/settings/ai-models
GET    /api/v1/settings/ai-agent
PUT    /api/v1/settings/ai-agent

GET    /api/v1/notifications
PATCH  /api/v1/notifications/read-all
```

---

## 구역 멤버 (Rooms 확장)

`src/pages/settings/DeviceSettings.js` — `RoomZoneSettings`

구역 **드래그 정렬**은 API가 아니라 브라우저 `localStorage`(`wavehome_room_order`, INTEGER id 배열)에만 저장한다.

### GET `/rooms/{roomId}/members`

**Response 200**
```json
[1, 2]
```

### PUT `/rooms/{roomId}/members`

**Request Body**
```json
{ "accountIds": [1] }
```

**Response 200** — 갱신된 member id 배열

---

## 장치·방 배치

### PUT `/devices/{deviceId}/room`

**Request Body** `{ "roomId": 1 }`

### DELETE `/devices/{deviceId}/room`

방 할당 해제. **Response 200** `{ "id": "…" }`

---

## AI 에이전트 설정

`src/pages/settings/AiAgentSettings.js`, `src/App.js`, `src/chat/ChatMessages.js`

### GET `/settings/ai-models`

**Response 200**
```json
[
  {
    "id": "gemini-flash2.5",
    "vendor": "google",
    "name": "gemini-flash2.5",
    "provider": "Google",
    "local": false,
    "embedding": false,
    "endpoint": "https://generativelanguage.googleapis.com/v1beta/openai",
    "apiKey": null
  }
]
```

> `apiKey`는 서버 설정에서 마스킹하거나 내려주지 않을 수 있다.

### GET `/settings/ai-agent`

**Response 200**
```json
{
  "personalPrompt": "",
  "selectedModelId": "gemini-flash2.5",
  "ctrlEnterSend": false,
  "waveAiSound": true
}
```

### PUT `/settings/ai-agent`

부분 수정 가능.

---

## 프론트 API 클래스 메서드 시그니처

`src/api/settingsApi.js` — mock/real 1:1 대응.

```js
settingsApi.getSession()
settingsApi.switchActiveAccount(accountId)

settingsApi.getAccounts()
settingsApi.createAccount({ name })
settingsApi.updateAccount(accountId, { name })
settingsApi.deleteAccount(accountId)

settingsApi.getRooms()
settingsApi.createRoom({ name, description })
settingsApi.updateRoom(roomId, { name, description })
settingsApi.deleteRoom(roomId)
settingsApi.getRoomMembers(roomId)
settingsApi.updateRoomMembers(roomId, accountIds)

settingsApi.getDevices()
settingsApi.createDevice(payload)
settingsApi.updateDevice(deviceId, payload)
settingsApi.deleteDevice(deviceId)
settingsApi.assignDeviceToRoom(deviceId, roomId)
settingsApi.unassignDeviceFromRoom(deviceId)

settingsApi.getSleepConfig()
settingsApi.updateSleepConfig(payload)

settingsApi.getGeneralSettings()
settingsApi.updateGeneralSettings(payload)

settingsApi.getSounds()
settingsApi.getTtsSpeakers()

settingsApi.getAiModels()
settingsApi.getAiAgentSettings()
settingsApi.updateAiAgentSettings({ personalPrompt, selectedModelId, ctrlEnterSend, waveAiSound })

settingsApi.getNotifications()
settingsApi.markAllNotificationsRead()
```

## 프론트 연동 지점

- `src/App.js` — `getSession`/`switchActiveAccount`로 활성 구성원 상태 관리.
- `src/pages/settings/AccountSettings.js`, `PersonalSettings.js` → Accounts 엔드포인트.
- `src/pages/settings/DeviceSettings.js` → Rooms + Devices 엔드포인트.
- `src/pages/settings/SleepSettings.js` → `/settings/sleep`, `/settings/sounds`.
- `src/pages/settings/GeneralSettings.js` → `/settings/general`, `/settings/sounds`, `/settings/tts-speakers`.
- `src/App.js`의 `notifications`/`markAllNotificationsRead` → `/notifications`, `/notifications/read-all`.
- Mock 시드 데이터: `src/data/appData.js`(accounts, notifications), `src/pages/settings/DeviceSettings.js`
  내부의 `initialRooms`/`initialInputDevices`/`initialOutputDevices`(mock 클래스로 옮겨질 예정).
