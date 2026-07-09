# Schedule Tasks API (루틴·일정)

구현된 프론트 코드: `weeklyPlanApi.js` → `src/api/v1/WeeklyPlanApi.js` · `src/api/mock/WeeklyPlanApi.js`

## 공통

- Base URL: `/api/v1`
- 세션 `activeAccount` 기준.
- DB 테이블: `schedule_task` (`docs/db-schema.md`).
- 에이전트용 internal API: [`docs/agent-api/schedule-tasks-api.md`](../../../docs/agent-api/schedule-tasks-api.md) (`/internal/v1/schedule-tasks`, `userId` 명시).

## 타입

```ts
type ScheduleKind = 'weekly' | 'once';
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type ScheduleTask = {
  id: number;
  title: string;
  createdAt: string | null;
  createdBy: 'user' | 'agent';
  category: string;
  scheduleKind: ScheduleKind;
  dayOfWeek: DayOfWeek;
  eventDate: string | null;     // once: 'YYYY-MM-DD'
  startMinute: number | null;
  endMinute: number | null;
  done: boolean;
  sourceInsightId: number | null;
};
```

## GET `/schedule-tasks`

**Query** (선택): `dayOfWeek`, `eventDate`, `scheduleKind`, `from`, `to`, `done`

**Response 200** — `ScheduleTask[]`

## POST `/schedule-tasks`

사용자 직접 추가:

```json
{
  "title": "스트레칭 10분",
  "dayOfWeek": "wed",
  "startMinute": 720,
  "endMinute": 730
}
```

인사이트에서 추가:

```json
{
  "sourceInsightId": 42,
  "dayOfWeek": "mon"
}
```

인사이트 적용(`POST /insights/{id}/apply`) 시에는 `insight.scheduleTaskJson` 전체를 서버가 사용한다.

**Response 201** — `ScheduleTask`

## PATCH `/schedule-tasks/{id}`

```json
{ "done": true }
```

**Response 200** — `ScheduleTask`

## DELETE `/schedule-tasks/{id}`

**Response 200** `{ "id": 5 }`

## 엔드포인트 요약

```http
GET    /api/v1/schedule-tasks
POST   /api/v1/schedule-tasks
PATCH  /api/v1/schedule-tasks/{id}
DELETE /api/v1/schedule-tasks/{id}
```

## 프론트 API

```js
weeklyPlanApi.getTasks()
weeklyPlanApi.createTask(payload)
weeklyPlanApi.updateTask(id, payload)
weeklyPlanApi.deleteTask(id)
```
