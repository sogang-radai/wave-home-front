# Insights API (공유)

구현: `PATCH /insights/{insightId}` — `SleepApi.updateInsight`, `WeeklyPlanApi.updateInsight`가 동일 경로를 호출합니다.

인사이트 카드 UI: 수면·주간 계획·(추후 자세) 페이지.

DB: `insight` 테이블 (`docs/db-schema.md`).

## 공통

- [common.md](./common.md) 규약 준수

## 타입

```ts
type Insight = {
  id: string;
  domain: 'sleep' | 'weekly-plan' | string;
  period: 'daily' | 'weekly' | null;
  label: string;       // UI 섹션 제목
  title: string;
  text: string;
  approved: boolean;
};
```

---

## PATCH `/insights/{insightId}`

사용자가 권장 액션 카드의 적용/해제를 토글할 때 호출합니다.

**Request Body**
```json
{ "approved": true }
```

**Response 200**
```json
{
  "id": "ins_daily_sleep_1",
  "approved": true
}
```

**Response 404** — 존재하지 않는 insight

주간 계획에서 `approved: true`로 바뀐 뒤 `POST /weekly-plan/tasks`에 `sourceInsightId`를 넘겨 실제 일정을 만들 수 있습니다.
