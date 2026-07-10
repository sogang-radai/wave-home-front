# Dashboard API (메인 대시보드)

구현된 프론트 코드: `src/api/dashboardApi.js`(진입점) · `src/api/mock/DashboardApi.js`(mock) ·
`src/api/v1/DashboardApi.js`(real).

`src/pages/MainPage.js` 상단의 히어로 인사말 배너, "현재 상태" 카드, "예정된 알람" 카드, "활성화된 제스처 목록" 카드에서 쓰는 데이터를 다룬다. 이 위젯들은 알람·가전 룰 데이터를 대시보드 표시용으로 걸러서(오늘/내일 아침 알람만, 활성 제스처 룰만) 보여주는 대시보드 전용 콘텐츠라 특정 도메인(`sleep.md`/`posture.md`/`alarm.md`/`iot.md`) 소관으로 넣지 않고 별도 문서로 뗐다. 대시보드의 다른 카드(어젯밤 수면, 전력 분석, 오늘 할일)는 각자 `sleep.md`/`iot.md`/`weekly-plan.md`를 그대로 쓰고, 여기서 새로 정의하지 않는다. 이 문서의 엔드포인트는 요청 시 `alarm`·`automation_rule` 테이블을 조회해 필터링·가공한 응답을 합성한다.

## 공통

- Base URL: `/api/v1`
- 현재 세션의 `activeAccount` 기준으로 조회한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 응답은 **요청 시 백엔드가 합성**한다. 별도 DB 테이블 없음(필요 시 서버 메모리 TTL 캐시만).
- `radar`는 현재 화면에는 나타나지 않는다. `iot.md`의 `GET /iot/radars` 목록 중 하나를 대표로 보여주는 요약으로, 목록 전체가 필요하면 `iot.md`를 그대로 쓸 수 있다.
- `controlMode`는 아직 `iot.md`의 제스처 세트(`daily`/`sleep`/`focus`/`rest`)와 연결돼 있지 않다 —
  가전 화면에 "지금 이 모드가 켜져 있다"는 기능 자체가 없어서, 지금은 대시보드 전용 표시값으로 별도
  관리한다. 나중에 모드 전환 기능이 생기면 `iot.md`의 제스처 세트 id를 그대로 재사용하도록 합친다.

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
type DailyMessage = {
  headline: string;
  body: string;
};

type CurrentState = {
  indoorEnvironment: { label: string; detail: string };
  controlMode: { label: string; activatedAt: string };   // activatedAt: ISO 8601
  radar: { connected: boolean; name: string };
};

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';   // alarm.md 와 동일

type UpcomingAlarm = {
  id: number;
  name: string;
  timeMinute: number;        // 자정 기준 분(0~1439). alarm.md 의 Alarm.timeMinute 과 동일
  daysOfWeek: DayOfWeek[];
  nextFireAt: string;        // ISO 8601. 서버가 계산한 다음 발동 시각
};

type ActiveGestureRule = {
  id: string;                  // automation_rule.external_id ('rule_gesture_desk_flash_light_on' 등). 숫자 PK가 아니다 — iot.md 의 ruleId 와 동일 규칙
  gestureSetId: string;        // 'desk_set' 등. 이름·썸네일은 iot.md 의 GET /iot/gesture-sets/{id} 로 조회
  classId: number;             // gestureSetId 안의 class id
  actionDeviceId: string;
  actionDeviceName: string;
  actionName: string;          // 'on' | 'volume_up' 등. 설명 문구는 프론트 device-class 카탈로그가 조합
};
```

---

## GET `/dashboard/daily-message`

대시보드 히어로 배너 인사말. 어젯밤 수면/오늘 자세/오늘 할일을 바탕으로 서버가 생성한 한 문단 요약이다.

**Response 200**
```json
{
  "headline": "오늘도 잘 해내고 있어요",
  "body": "어제 수면 점수는 84점으로, 입면까지 24분이 걸렸고 깊은 수면 비율은 전주 평균보다 8% 높았어요. 자세 점수는 78점으로, 오후 3시 이후 목이 앞으로 나오는 패턴이 반복되었으니 짧은 스트레칭으로 챙겨주세요. 오늘은 취침 1시간 전 조명을 낮추고, 50분 착석마다 1분 목 리셋 루틴을 실행해보세요!"
}
```

## GET `/dashboard/current-state`

"현재 상태" 카드(실내 환경/가전 제어 모드/레이더 연결 상태). 자세 점수는 이 카드에도 표시되지만
`posture.md`의 `GET /posture/today/summary`를 그대로 재사용한다 — 여기서는 다루지 않는다.

**Response 200**
```json
{
  "indoorEnvironment": { "label": "쾌적", "detail": "온도 24℃ · 조도 낮음" },
  "controlMode": { "label": "집중 모드", "activatedAt": "2026-07-02T13:00:00+09:00" },
  "radar": { "connected": true, "name": "방 1" }
}
```

## GET `/dashboard/alarms/upcoming`

"예정된 알람" 카드. `alarm` 테이블에서 **활성화된(enabled=1)** 알람 중 **오늘 안에 울리거나, 내일 정오(12:00) 이전에 울리는** 알람만 골라 다음 발동 시각(`nextFireAt`) 순으로 정렬해 반환한다. 여기서는 대시보드 노출 여부 필터링과 "다음 발동 시각" 계산만 서버가 미리 해서 내려준다(클라이언트마다 요일 롤오버 로직을
중복 구현하지 않도록).

`nextFireAt` 계산 규칙은 `daysOfWeek`가 비어있으면(1회성) 현재 시각 기준 가장 빠른 다음 발동 시각, 아니면
`daysOfWeek` 중 현재 이후로 가장 빠른 요일의 `timeMinute`이다. `alarm.md`의 `daysOfWeek`/`timeMinute` 정의와 동일한 규칙이다.

**Response 200**
```json
[
  {
    "id": 2,
    "name": "주말 늦잠",
    "timeMinute": 570,
    "daysOfWeek": ["sat", "sun"],
    "nextFireAt": "2026-07-11T00:30:00.000Z"
  }
]
```

`nextFireAt`은 UTC ISO 8601(`Z`)이다. (위 예시는 KST 09:30을 UTC로 표기) `mock`은 `Date.toISOString()`을 그대로 쓰므로 백엔드도 동일 표기를 따른다(`isoAgo` 등 다른 mock 엔드포인트와 동일 관례).

빈 배열이면 오늘·내일 아침으로 예정된 알람이 없다는 뜻이다(카드에 "예정된 알람이 없어요" 표시).

## GET `/dashboard/gestures/active`

"활성화된 제스처 목록" 카드에서는 `automation_rule` 중 **활성화(enabled=1)** 되어 있고 `trigger_json.kind='gesture'`인 룰만 골라 반환한다. 여기서는 "지금당장 켜져 있는 제스처 룰만" 걸러서 보여준다. 응답에는 제스처 **이름·썸네일**이나 동작의 사람이 읽는 **설명 문구**를 포함하지 않는다. 프론트가`gestureSetId`로 `iot.md`의 `GET /iot/gesture-sets/{gestureSetId}`를 호출해 `classId`에 해당하는 제스처 이름·썸네일을 얻고, `actionName`은 프론트의 장치 클래스 카탈로그(`iot.md`의 "장치 클래스· capabilities")로 사람이 읽는 설명으로 변환한다.

**automation_rule → 응답 필드 매핑** (실제 저장 스키마 기준, `mock.db` 대조 확인됨)
- `id` — `automation_rule.external_id` (TEXT, `"rule_gesture_desk_flash_light_on"` 형태). `automation_rule.id`(INTEGER PK)가 아니다 — `iot.md`의 `ruleId`와 동일 규칙.
- `gestureSetId`/`classId` — `trigger_json`에서 추출. `trigger_json`은 배열이 아니라 단일 객체다.
- `actionDeviceId`/`actionName` — `actions_json[0].deviceId`/`actions_json[0].name`. `actions_json`은 **배열**이라 액션이 여러 개일 수 있지만, 이 카드는 필드가 단수형이라 **첫 번째 액션만 대표로 보여준다**(2번째 이후 액션은 노출하지 않음).
- `actionDeviceName` — `actions_json`에 이름이 없으므로 `device` 테이블을 `device_id`로 조회해 채운다.

> ⚠️ **알려진 스키마 갭**(백엔드팀 전달 예정, 아직 미반영): 지금 `mock.db`의 실제 `trigger_json`에는 `kind` 판별 필드가 없고(예: `{"deviceQuery": "presence", "condition": "absent"}`), 제스처 트리거 룰 자체도 시드에 없다. 위 `trigger_json.kind='gesture'` 필터가 실제로 동작하려면 백엔드가 트리거 저장 시 `kind` 필드를 일관되게 넣어줘야 한다. 이 문서의 예시는 그 스키마가 갖춰졌다고 가정한 것이다.

**Response 200**
```json
[
  {
    "id": "rule_gesture_desk_flash_light_on",
    "gestureSetId": "desk_set",
    "classId": 7,
    "actionDeviceId": "5d0a3f8c26b91e74",
    "actionDeviceName": "거실 조명",
    "actionName": "on"
  },
  {
    "id": "rule_gesture_desk_swipe_tv_volume_up",
    "gestureSetId": "desk_set",
    "classId": 10,
    "actionDeviceId": "2c9f6a1b4d78e350",
    "actionDeviceName": "거실 TV",
    "actionName": "volume_up"
  }
]
```

목록 길이 제한이나 페이지네이션은 없고, 개수가 늘어나 카드가 길어지면 프론트가 캐러셀(이전/다음 버튼)로 카드 안에 한 번에 하나씩만 보여주는 방식으로 해결한다.

---

## 전체 엔드포인트 요약

```http
GET /api/v1/dashboard/daily-message
GET /api/v1/dashboard/current-state
GET /api/v1/dashboard/alarms/upcoming
GET /api/v1/dashboard/gestures/active
```

## 프론트 API 메서드 시그니처

```js
dashboardApi.getDailyMessage()
dashboardApi.getCurrentState()
dashboardApi.getUpcomingAlarms()
dashboardApi.getActiveGestureRules()
```

## 프론트 연동 지점

- `src/pages/MainPage.js` → 히어로 배너는 `getDailyMessage()`, "현재 상태" 카드의 실내 환경/가전 제어 모드/레이더 연결 상태는 `getCurrentState()`. 같은 카드의 자세 점수는 기존대로 `postureApi.getTodaySummary()`를 그대로 쓴다.
- `src/pages/MainPage.js` → "예정된 알람" 카드는 `getUpcomingAlarms()`, 클릭 시 `alarm.md` 화면  (`AlarmPage`)으로 이동.
- `src/pages/MainPage.js` → "활성화된 제스처 목록" 카드는 `getActiveGestureRules()` + 각 룰의 `gestureSetId`별로 `iotApi.getGestureSetDefinition(gestureSetId)`를 호출(중복 id는 캐시)해 이름·썸네일을 채운다. 카드 안에서는 한 번에 하나씩만 보여주고 우하단 이전/다음 버튼으로 넘긴다. 클릭 시 `iot.md`의 "제스처 목록" 탭(`HomeControlPage` `tab='gesture'`)으로 이동.
- Mock 시드 데이터: `src/data/overviewData.js`의 `dailyMessage`, `src/data/alarmData.js`의 `initialAlarms`, `src/data/ruleData.js`의 `ruleSeed`.
