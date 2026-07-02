# Posture API (자세 관리)

구현 예정 프론트 코드: `src/api/postureApi.js`(진입점) · `src/api/mock/PostureApi.js`(mock) ·
`src/api/v1/PostureApi.js`(real).

## 공통

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- daily log의 `time`은 해당 `date` 기준의 `HH:mm` 형식이다.
- 자세 데이터는 현재 세션의 `activeAccount` 기준으로 조회/저장한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`
- 인사이트 승인은 `sleep.md`에 정의된 `PATCH /insights/{insightId}`를 그대로 재사용한다(중복 정의 없음).

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
type HourlyPosture = {
  hour: string;             // "09"
  score: number;            // 0~100
  turtleNeckCount: number;
};

type PostureLogPoint = {
  time: string;             // "09:00", daily report의 date 기준
  label: string;            // "좋음"
  score: number;            // 0~100
};

type AnalysisItem = {
  label: string;
  value: string;
  description: string;
};

type Insight = {
  id: string;
  domain: 'sleep' | 'posture';
  period: 'daily' | 'weekly';
  label: string;
  title: string;
  text: string;
  approved: boolean;
};

type AlertSettings = { turtleNeck: boolean; waistTilt: boolean; longSitting: boolean };
```

---

## GET `/posture/today/summary`

메인 대시보드(`MainPage`)용 요약 카드.

**Response 200**
```json
{
  "score": 78,
  "turtleNeckCount": 4,
  "turtleNeckLastWeekAverageCount": 7.3,
  "correctPosturePercent": 71,
  "alertAcceptRatePercent": 62
}
```

## GET `/posture/today`

"현재 상태" 탭 스냅샷. 현재 순간의 상태(`current`)와 오늘 누적 통계(`stats`)를 분리해서 반환한다.

**Response 200**
```json
{
  "date": "2026-07-02",
  "current": {
    "postureText": "정자세 유지 중",
    "feedbackText": "지금 자세가 좋아요! 이대로 30분만 더 유지해보세요."
  },
  "stats": {
    "score": 78,
    "correctPosturePercent": 71,
    "correctPostureGoalPercent": 80,
    "alertAcceptRatePercent": 62,
    "totalSittingMinutes": 320,
    "maxContinuousSittingMinutes": 108,
    "recommendedMaxContinuousSittingMinutes": 90
  },
  "hourly": [
    { "hour": "09", "score": 82, "turtleNeckCount": 0 },
    { "hour": "10", "score": 75, "turtleNeckCount": 1 }
  ]
}
```

## GET `/posture/reports/daily`

`date` 쿼리로 특정 날짜의 자세 리포트를 조회한다. 생략 시 가장 최근 완료된 날(어제)을 반환한다.
리포트 제목은 프론트가 고정 문구로 만든다.

**Query** `?date=2026-07-01`

**Response 200**
```json
{
  "date": "2026-07-01",
  "score": 82,
  "summary": "오후 시간대에 자세가 무너지는 경향이 있었어요.",
  "log": [
    { "time": "09:00", "label": "좋음", "score": 88 }
  ],
  "analysis": [
    {
      "label": "자세 점수",
      "value": "82점",
      "description": "전일 대비 +3점"
    },
    {
      "label": "가장 무너진 시간대",
      "value": "15:00~17:00",
      "description": "거북목 3회 감지"
    }
  ]
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "date는 YYYY-MM-DD 형식이어야 합니다."
  }
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "해당 날짜의 자세 기록이 없습니다." } }
```

## GET `/posture/reports/weekly`

`weekStart` 쿼리로 해당 주(월요일 시작) 리포트를 조회한다. 생략 시 현재 주의 월요일 기준 리포트를 반환한다.
`weekStart`는 반드시 월요일 날짜여야 한다. 리포트 제목은 프론트가 고정 문구로 만든다.

**Query** `?weekStart=2026-06-29`

**Response 200**
```json
{
  "weekStart": "2026-06-29",
  "weekEnd": "2026-07-05",
  "score": 81,
  "summary": "거북목 지속 시간이 줄었어요.",
  "averageScore": 81,
  "trend": [
    { "date": "2026-06-29", "day": "월", "score": 74 }
  ],
  "analysis": [
    {
      "label": "점수 변화",
      "value": "74→81점",
      "description": "꾸준히 상승"
    },
    {
      "label": "거북목 지속 시간",
      "value": "18% 감소",
      "description": "스트레칭 알림 효과"
    }
  ]
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_WEEK_START",
    "message": "weekStart는 해당 주의 월요일 날짜여야 합니다."
  }
}
```

## GET `/posture/insights/daily`

daily/weekly 탭이 고정이므로 인사이트 API는 query 방식으로 합치지 않고 기존 경로를 유지한다.

**Response 200**
```json
[
  {
    "id": "ins_01J2ZQAF7E2X8M5K3D9R1V0ABC",
    "domain": "posture",
    "period": "daily",
    "label": "오늘의 권장 액션",
    "title": "거북목 교정 스트레칭 3세트",
    "text": "오후 시간대 거북목이 반복 감지됐어요.",
    "approved": false
  }
]
```

## GET `/posture/insights/weekly`

**Response 200**
```json
[
  {
    "id": "ins_01J2ZQB9K6T4P8N2M5R0C7D3EF",
    "domain": "posture",
    "period": "weekly",
    "label": "다음 주 목표",
    "title": "50분마다 자리에서 일어나기",
    "text": "장시간 착석이 자세 저하의 주요 원인이에요.",
    "approved": false
  }
]
```

## GET `/posture/settings/alerts`

`PosturePage`의 알림 설정 토글(거북목/허리 기울임/장시간 착석). 필드 구조는 현재 프론트의 단순 토글에
맞춰 유지한다.

**Response 200**
```json
{ "turtleNeck": true, "waistTilt": true, "longSitting": false }
```

## PUT `/posture/settings/alerts`

**Request Body**
```json
{ "turtleNeck": true, "waistTilt": false, "longSitting": true }
```

**Response 200** — 저장된 설정
```json
{ "turtleNeck": true, "waistTilt": false, "longSitting": true }
```

**Response 400**
```json
{ "error": { "code": "INVALID_BODY", "message": "설정 값은 boolean이어야 합니다." } }
```

---

인사이트 승인/적용 토글은 `sleep.md`의 `PATCH /insights/{insightId}` 엔드포인트를 그대로 사용한다.

## 전체 엔드포인트 요약

```http
GET /api/v1/posture/today/summary
GET /api/v1/posture/today

GET /api/v1/posture/reports/daily?date=2026-07-01
GET /api/v1/posture/reports/weekly?weekStart=2026-06-29

GET /api/v1/posture/insights/daily
GET /api/v1/posture/insights/weekly

GET /api/v1/posture/settings/alerts
PUT /api/v1/posture/settings/alerts
```

## 프론트 API 메서드 시그니처 (구현 예정)

```js
postureApi.getTodaySummary()
postureApi.getToday()

postureApi.getDailyReport(date)
postureApi.getWeeklyReport(weekStart)

postureApi.getDailyInsights()
postureApi.getWeeklyInsights()

postureApi.getAlertSettings()
postureApi.updateAlertSettings(payload)
```

## 프론트 연동 지점 (구현 예정)

- `src/pages/posture/PosturePage.js` → `/posture/today`, `/posture/settings/alerts`,
  `/posture/insights/daily`, `/posture/insights/weekly`
- `src/pages/posture/PostureDailyReport.js` → `/posture/reports/daily`
- `src/pages/posture/PostureWeeklyReport.js` → `/posture/reports/weekly`
- `src/pages/MainPage.js` → `/posture/today/summary`
- Mock 시드 데이터: `src/data/postureData.js`
