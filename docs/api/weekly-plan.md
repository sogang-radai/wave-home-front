# Weekly Plan API (주간 계획)

프론트 진입점: `weeklyPlanApi.js`.

## 구성

| 영역 | API | 데이터 소스 |
|------|-----|-------------|
| 상단 AI 배너 | `GET /weekly-plan/report` | `weekly_plan_report` |
| 캘린더·할일 | [schedule-tasks.md](./schedule-tasks.md) | `schedule_task` |
| 우측 AI 추천 | `GET /weekly-plan/recommendations` | `insight` (`surface=weekly_plan`) |

## GET `/weekly-plan/report`

해당 주(또는 최신) 배너.

**Query**: `periodStart` (선택, 월요일 `YYYY-MM-DD`)

**Response 200**

```json
{
  "headline": "이번 주는 수면 리듬을 회복해 보세요",
  "body": "지난주 대비 수면 시간이 …"
}
```

`weekly_plan_report` 의 `{ headline, report_text }` 매핑. `metrics` 컬럼 없음.

## GET `/weekly-plan/recommendations`

**Response 200** — `Insight[]` (`surface=weekly_plan`, `date=오늘`, `createdAt` asc)

프론트는 `label` 로 섹션 그룹핑.

인사이트 적용: [insights.md](./insights.md) `POST /insights/{id}/apply`

## 할일 CRUD

→ [schedule-tasks.md](./schedule-tasks.md)

## 배너 생성

프론트가 직접 생성하지 않는다. 백엔드 → 에이전트 `POST /weekly-plan/v1/reports` (`docs/agent-api/weekly-plan-analysis-api.md`).

## 프론트 API

```js
weeklyPlanApi.getWeeklyAgentReport()   // → GET /weekly-plan/report
weeklyPlanApi.getRecommendations()     // → GET /weekly-plan/recommendations
weeklyPlanApi.getTasks()               // → GET /schedule-tasks
weeklyPlanApi.createTask(payload)
weeklyPlanApi.updateTask(id, payload)
weeklyPlanApi.deleteTask(id)
```
