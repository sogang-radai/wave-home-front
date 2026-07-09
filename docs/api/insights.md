# Insights API (인사이트)

공통 인사이트 조회·원탭 적용. 페이지별 thin wrapper 도 동일 테이블을 조회한다.

## 공통

- Base URL: `/api/v1`
- DB: `insight` (`docs/db-schema.md`)

## 타입

```ts
type InsightSurface =
  | 'dashboard_banner'
  | 'weekly_plan'
  | 'sleep_report'
  | 'posture_report'
  | 'power';

type InsightActionType = 'schedule_task' | 'automation_rule' | 'reservation';

type Insight = {
  id: number;
  surface: InsightSurface;
  kind: 'banner' | 'action' | 'goal' | 'tip';
  date: string;                    // 'YYYY-MM-DD'
  label: string | null;
  title: string;
  text: string;
  actionable: boolean;
  actionType: InsightActionType | null;
  approved: boolean;
  ruleJson: object | null;         // automation_rule | reservation — Rule (automation_rule 테이블)
  scheduleTaskJson: object | null; // schedule_task 초안
  createdAt: string;
};
```

## GET `/insights`

**Query**: `surface`, `date`, `kind`, `approved`, `actionable`

**Response 200** — `Insight[]`, `createdAt` asc.

## GET `/insights/{id}`

**Response 200** — `Insight`

## POST `/insights/{id}/apply`

`actionable=1`, `approved=0` 카드 **원탭 적용**.

| `actionType` | 동작 |
|--------------|------|
| `schedule_task` | `scheduleTaskJson` → `schedule_task` 행 생성 |
| `automation_rule` | `ruleJson` → SQLite `automation_rule` (RuleStore) |
| `reservation` | `ruleJson` → SQLite `automation_rule` |

**Response 200**

```json
{
  "id": 42,
  "approved": true,
  "ruleJson": null,
  "derivedScheduleTaskId": 15
}
```

**Response 409** — `ALREADY_APPLIED` | `RULE_ID_CONFLICT`

## PATCH `/insights/{id}`

적용 취소(선택):

```json
{ "approved": false }
```

→ `ruleJson.id` 룰 삭제, `source_insight_id` 로 파생 `schedule_task` 삭제.

## 페이지별 wrapper (프론트 `*Api.js`)

도메인 API는 내부적으로 `GET /api/v1/insights` 를 호출한다 (`surface` 필터).

| 프론트 메서드 | HTTP |
|---------------|------|
| `sleepApi.getInsights({ period, date })` | `GET /insights?surface=sleep_report` (+ period 클라이언트 필터) |
| `postureApi.getDailyInsights()` / `getWeeklyInsights()` | `GET /insights?surface=posture_report` (+ period 필터) |
| `weeklyPlanApi.getRecommendations()` | `GET /weekly-plan/recommendations` → `surface=weekly_plan` |
| `dashboardApi.getDailyMessage()` | `GET /dashboard/daily-message` → `surface=dashboard_banner` |

## 엔드포인트 요약

```http
GET    /api/v1/insights
GET    /api/v1/insights/{id}
POST   /api/v1/insights/{id}/apply
PATCH  /api/v1/insights/{id}
```

## 프론트 API

```js
insightsApi.list({ surface, date, kind, approved, actionable })
insightsApi.get(id)
insightsApi.apply(id)
insightsApi.updateInsight(id, { approved })
```

도메인 thin wrapper: `sleepApi.getInsights`, `postureApi.getDailyInsights`, `weeklyPlanApi.updateInsight` 등.

## 생성

인사이트 **생성**은 프론트 API가 아니다. 백엔드가 에이전트 `POST /insight/v1/insights` 잡을 호출한 뒤 DB 에 저장한다 (`docs/agent-api/insight-generation-api.md`).
