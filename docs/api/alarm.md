# Alarm API (알람)

구현된 프론트 코드: `src/api/alarmApi.js`(진입점) · `src/api/mock/AlarmApi.js`(mock) ·
`src/api/v1/AlarmApi.js`(real).

## 공통

- Base URL: `/api/v1`
- 알람은 현재 세션의 `activeAccount` 기준으로 조회/생성/수정/삭제한다.
- 에이전트용 internal API: [`docs/agent-api/alarms-api.md`](../../../docs/agent-api/alarms-api.md) (`/internal/v1/alarms`, `userId` 명시).
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`
- 알람 장치 실행(조명/콘센트/TTS)과 "기상 맞춤 알람"의 수면단계 판단은 이 문서의 범위가 아니다.
  이 API는 사용자 설정값의 CRUD만 다룬다.

## 타입

```ts
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type AlarmMethod =
  | { type: 'light_blink'; brightness: number; intervalSec: number }  // brightness 10~100, intervalSec 1~10
  | { type: 'light_on'; brightness: number }                          // brightness 10~100
  | { type: 'plug_toggle' }
  | { type: 'plug_on' }
  | { type: 'plug_off' }
  | { type: 'tts'; speakerId: number; text: string; repeatCount: number; intervalSec: number };
  // repeatCount 1~20, intervalSec(초) 1~60

type Alarm = {
  id: number;
  name: string;
  timeMinute: number;            // 자정 기준 분(0~1439)
  daysOfWeek: DayOfWeek[];       // [] = 1회성(현재 시각 기준 가장 빠른 다음 시각에 1회)
  smartWake: boolean;            // 기상 맞춤 알람 여부
  radarDeviceId: string | null;  // smartWake=true 일 때만 사용, class='srs_r4sn' 장치
  deviceId: string | null;       // 알람 장치(단일). class는 method.type과 호환되어야 함
  method: AlarmMethod | null;
  enabled: boolean;
  createdAt: string;             // 'YYYY-MM-DD HH:MM:SS'
  updatedAt: string;
};
```

`deviceId`가 가리키는 장치의 `class`에 따라 허용되는 `method.type`이 정해진다.

| device.class | 허용 method.type |
|---|---|
| `philips_wiz_e29_color`, `philips_wiz_e29_white` | `light_blink`, `light_on` |
| `tuya_ep2h` | `plug_toggle`, `plug_on`, `plug_off` |
| `wave_station`, `reolink_e1_pro` | `tts` |

---

## GET `/alarms`

전체 알람 목록. `timeMinute` 오름차순으로 정렬해 반환한다.

**Response 200**
```json
[
  {
    "id": 1,
    "name": "평일 기상",
    "timeMinute": 420,
    "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
    "smartWake": true,
    "radarDeviceId": "3a7f2c9d10b4e85f",
    "deviceId": "5c1e8b6402fda973",
    "method": { "type": "tts", "speakerId": 0, "text": "좋은 아침이에요! 일어날 시간입니다.", "repeatCount": 3, "intervalSec": 20 },
    "enabled": true,
    "createdAt": "2026-06-10 08:00:00",
    "updatedAt": "2026-06-10 08:00:00"
  }
]
```

## POST `/alarms`

- `timeMinute`은 필수다.
- `daysOfWeek`를 생략하거나 빈 배열로 보내면 1회성 알람이 된다.
- `smartWake`가 `true`면 `radarDeviceId`가 필수다.
- `method.type`은 `deviceId` 장치의 class와 호환되어야 한다(위 표 참고). 프론트에서 사전 필터링하지만
  서버도 검증한다.

**Request Body**
```json
{
  "name": "주말 늦잠",
  "timeMinute": 570,
  "daysOfWeek": ["sat", "sun"],
  "smartWake": false,
  "radarDeviceId": null,
  "deviceId": "5d0a3f8c26b91e74",
  "method": { "type": "light_on", "brightness": 70 },
  "enabled": true
}
```

**Response 201** — 생성된 `Alarm` 전체 (`id`/`createdAt`/`updatedAt` 포함)

**Response 400**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요.",
    "details": [
      { "field": "radarDeviceId", "code": "REQUIRED", "message": "기상 맞춤 알람은 레이더를 선택해야 합니다." }
    ]
  }
}
```

## PATCH `/alarms/{id}`

바뀐 필드만 부분적으로 담아 보낸다. 카드의 활성/비활성 토글도 이 엔드포인트로 처리한다.

**Request Body** — 활성화 토글
```json
{ "enabled": false }
```

**Request Body** — 수정 모달 저장
```json
{
  "name": "평일 기상",
  "timeMinute": 390,
  "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
  "smartWake": true,
  "radarDeviceId": "3a7f2c9d10b4e85f",
  "deviceId": "5c1e8b6402fda973",
  "method": { "type": "tts", "speakerId": 1, "text": "일어날 시간이에요.", "repeatCount": 3, "intervalSec": 20 }
}
```

**Response 200** — 갱신된 `Alarm` 전체

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "알람을 찾을 수 없습니다." } }
```

## DELETE `/alarms/{id}`

**Response 200**
```json
{ "id": 1 }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "알람을 찾을 수 없습니다." } }
```

---

## 전체 엔드포인트 요약

```http
GET    /api/v1/alarms
POST   /api/v1/alarms
PATCH  /api/v1/alarms/{id}
DELETE /api/v1/alarms/{id}
```

## 프론트 API 메서드 시그니처

```js
alarmApi.getAlarms()
alarmApi.createAlarm(payload)
alarmApi.updateAlarm(id, payload)
alarmApi.deleteAlarm(id)
```

## 프론트 연동 지점

- `src/pages/alarm/AlarmPage.js` → `getAlarms`, `createAlarm`, `updateAlarm`, `deleteAlarm`
- `src/pages/alarm/AlarmEditor.js` → 시간/요일/기상맞춤/장치/방법 입력 후 저장
- `src/pages/alarm/AlarmCard.js` → 카드 우하단 토글이 `updateAlarm(id, { enabled })` 호출
- 장치 목록·레이더 콤보는 `iotApi.getDevices()`, TTS 목소리 콤보는 `settingsApi.getTtsSpeakers()` 재사용(신규 엔드포인트 아님)
- Mock 시드 데이터: `src/data/alarmData.js`(`initialAlarms`)
