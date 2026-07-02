# Weekly Plan API (일정)

구현 예정 프론트 코드: `src/api/weeklyPlanApi.js`(진입점) · `src/api/mock/WeeklyPlanApi.js`(mock) ·
`src/api/v1/WeeklyPlanApi.js`(real).

## 공통

- Base URL: `/api/v1`
- 주간 계획은 현재 세션의 `activeAccount` 기준으로 조회/생성/수정/삭제한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`
- 인사이트 승인은 `sleep.md`에 정의된 `PATCH /insights/{insightId}`를 재사용한다.

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
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type TaskCategory = 'posture' | 'sleep' | 'diet' | 'mental';

type Task = {
  id: string;
  title: string;
  done: boolean;
  dayOfWeek: DayOfWeek;
  category: TaskCategory;       // 서버가 title 기반 자동 분류, PATCH에서는 수동 수정 가능
  startMinute?: number;         // 자정 기준 분 단위, 예: 07:00 = 420
  endMinute?: number;
  sourceInsightId?: string | null;
};

type Insight = {
  id: string;
  domain: 'sleep' | 'posture' | 'weekly-plan';
  period: 'daily' | 'weekly';
  label: string;
  title: string;
  text: string;
  approved: boolean;
};

type RecommendationGroup = {
  key: 'daily_action' | 'next_week_goal' | string;
  label: string;
  items: Insight[];
};
```

`Task`는 주차별 반복 템플릿이 아니라 현재 주간 계획 화면에서 관리하는 단일 일정 항목이다. 주차별 반복
일정과 완료 이력은 이 API에서 다루지 않는다. `done`은 해당 `Task` 자체의 완료 상태다.

---

## GET `/weekly-plan/tasks`

주간 캘린더/오늘의 할 일 목록에서 사용하는 전체 task 목록.

**Response 200**
```json
[
  {
    "id": "task_01J2ZQ8M6R9P4T7X3A5B2C1D0E",
    "title": "기상 후 목 스트레칭 20초",
    "done": false,
    "dayOfWeek": "mon",
    "category": "posture",
    "startMinute": 420,
    "endMinute": 440,
    "sourceInsightId": null
  }
]
```

## POST `/weekly-plan/tasks`

드래그로 새 일정을 만들거나 "새 계획 추가" 팝업에서 저장할 때 호출한다.

- 직접 만든 task는 `title`과 `dayOfWeek`가 필수다.
- 직접 만든 task의 `category`는 보내지 않는다. 서버가 `title`을 보고 자동 분류한다.
- 추천 액션을 실제 task로 만들 때는 `sourceInsightId`를 보낸다. 이 경우 서버가 insight의 `title`을 task
  제목으로 사용하고, insight의 `domain`을 바탕으로 `category`를 정한다.
- `startMinute`/`endMinute`은 선택값이다. 생략하면 서버가 분류된 카테고리의 기본 시간대를 지정한다.
- 시간 지정 시 `startMinute`과 `endMinute`을 함께 보내야 한다.
- `startMinute`/`endMinute`은 0 이상 1440 이하의 정수이며, `endMinute`은 `startMinute`보다 커야 한다.

**Request Body** — 직접 생성
```json
{
  "title": "저녁 산책 30분",
  "dayOfWeek": "wed",
  "startMinute": 1140,
  "endMinute": 1170
}
```

**Request Body** — 시간 생략
```json
{
  "title": "저녁 산책 30분",
  "dayOfWeek": "wed"
}
```

**Request Body** — 추천 액션에서 생성
```json
{
  "sourceInsightId": "ins_01J2ZQAF7E2X8M5K3D9R1V0ABC",
  "dayOfWeek": "mon",
  "startMinute": 1380,
  "endMinute": 1410
}
```

**Response 201**
```json
{
  "id": "task_01J2ZQ8M6R9P4T7X3A5B2C1D0E",
  "title": "저녁 산책 30분",
  "done": false,
  "dayOfWeek": "wed",
  "category": "mental",
  "startMinute": 1140,
  "endMinute": 1170,
  "sourceInsightId": null
}
```

**Response 201** — 추천 액션에서 생성
```json
{
  "id": "task_01J2ZQ9BS7F4K2N8R5X1M0Q3PA",
  "title": "에어컨 예약을 새벽 4시까지 1시간 연장",
  "done": false,
  "dayOfWeek": "mon",
  "category": "sleep",
  "startMinute": 1380,
  "endMinute": 1410,
  "sourceInsightId": "ins_01J2ZQAF7E2X8M5K3D9R1V0ABC"
}
```

**Response 400**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요.",
    "details": [
      {
        "field": "dayOfWeek",
        "code": "INVALID_ENUM",
        "message": "dayOfWeek는 mon, tue, wed, thu, fri, sat, sun 중 하나여야 합니다."
      }
    ]
  }
}
```

## PATCH `/weekly-plan/tasks/{id}`

일정 이동(드래그), 상세 모달 저장, "오늘의 할 일" 완료 토글까지 전부 이 엔드포인트 하나로 처리한다.
바디에는 바뀐 필드만 부분적으로 담아 보낸다.

- 빈 body는 `400 INVALID_BODY`를 반환한다.
- `title`이 포함된 경우 빈 문자열일 수 없다.
- `dayOfWeek`가 포함된 경우 허용된 요일 enum이어야 한다.
- `category`는 PATCH에서 사용자가 상세 모달을 통해 수동 수정할 수 있다.
- `startMinute`/`endMinute`은 함께 포함되어야 하며, `endMinute > startMinute`이어야 한다.

**Request Body** — 드래그로 시간/요일 이동
```json
{
  "startMinute": 480,
  "endMinute": 500,
  "dayOfWeek": "thu"
}
```

**Request Body** — 완료 토글
```json
{ "done": true }
```

**Request Body** — 상세 모달에서 저장
```json
{
  "title": "저녁 산책 40분",
  "category": "mental",
  "startMinute": 1140,
  "endMinute": 1180,
  "done": false
}
```

**Response 200** — 갱신된 `Task` 전체
```json
{
  "id": "task_01J2ZQ8M6R9P4T7X3A5B2C1D0E",
  "title": "저녁 산책 40분",
  "done": false,
  "dayOfWeek": "wed",
  "category": "mental",
  "startMinute": 1140,
  "endMinute": 1180,
  "sourceInsightId": null
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_TIME_RANGE",
    "field": "endMinute",
    "message": "종료 시간은 시작 시간보다 늦어야 합니다."
  }
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "일정을 찾을 수 없습니다." } }
```

## DELETE `/weekly-plan/tasks/{id}`

일정을 삭제한다. 삭제 성공 응답은 다른 도메인과 맞춰 `200 OK`와 삭제된 ID를 반환한다.

**Response 200**
```json
{ "id": "task_01J2ZQ8M6R9P4T7X3A5B2C1D0E" }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "일정을 찾을 수 없습니다." } }
```

## GET `/weekly-plan/recommendations`

수면/자세 도메인의 인사이트를 `label` 기준으로 병합·그룹핑해 "AI 맞춤 추천 계획" 패널에 한 번에
내려준다. 추천 액션을 실제 task로 만들 때는 `POST /weekly-plan/tasks`에 `sourceInsightId`를 함께 보낸다.

**Response 200**
```json
[
  {
    "key": "daily_action",
    "label": "오늘의 권장 액션",
    "items": [
      {
        "id": "ins_01J2ZQAF7E2X8M5K3D9R1V0ABC",
        "domain": "sleep",
        "period": "daily",
        "label": "오늘의 권장 액션",
        "title": "에어컨 예약을 새벽 4시까지 1시간 연장",
        "text": "새벽 실내 온도가 26℃를 넘으며 뒤척임이 늘었어요.",
        "approved": false
      }
    ]
  },
  {
    "key": "next_week_goal",
    "label": "다음 주 목표",
    "items": [
      {
        "id": "ins_01J2ZQB9K6T4P8N2M5R0C7D3EF",
        "domain": "sleep",
        "period": "weekly",
        "label": "다음 주 목표",
        "title": "취침 30분 앞당기기",
        "text": "주 후반 취침 시간이 늦어지는 패턴이 반복됐어요.",
        "approved": true
      }
    ]
  }
]
```

승인/적용 토글은 `sleep.md`의 `PATCH /insights/{insightId}`를 그대로 사용한다. 추천 액션을 실제 일정으로
추가하는 동작은 승인 토글과 별개로 `POST /weekly-plan/tasks`의 `sourceInsightId` 생성 흐름을 사용한다.

---

## 전체 엔드포인트 요약

```http
GET    /api/v1/weekly-plan/tasks
POST   /api/v1/weekly-plan/tasks
PATCH  /api/v1/weekly-plan/tasks/{id}
DELETE /api/v1/weekly-plan/tasks/{id}

GET    /api/v1/weekly-plan/recommendations

PATCH  /api/v1/insights/{insightId}
```

## 프론트 API 메서드 시그니처 (구현 예정)

```js
weeklyPlanApi.getTasks()
weeklyPlanApi.createTask(payload)
weeklyPlanApi.updateTask(id, payload)
weeklyPlanApi.deleteTask(id)

weeklyPlanApi.getRecommendations()

weeklyPlanApi.updateInsight(insightId, { approved })
```

## 프론트 연동 지점 (구현 예정)

- `src/pages/WeeklyPlanPage.js` → `/weekly-plan/tasks`(GET/POST/PATCH/DELETE), `/weekly-plan/recommendations`
- `src/App.js`의 `todos`/`toggleTodo`/`addTodo`/`updateTodo` → `tasks` API로 교체
- `src/context/ApprovedActionsContext.js` → `PATCH /insights/{id}` 호출로 대체(전역 client-only 상태 제거)
- Mock 시드 데이터: `src/data/weeklyPlanData.js`(`initialTodos`, `CAT_STYLE.defaultMin`)
