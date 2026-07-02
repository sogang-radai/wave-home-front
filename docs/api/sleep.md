# Sleep API (수면 관리)

구현 예정 프론트 코드: `src/api/sleepApi.js`(진입점) · `src/api/mock/SleepApi.js`(mock) ·
`src/api/v1/SleepApi.js`(real). 취침 전 자동화 **설정**(`bedtime`, `acAuto` 등)은 이 도메인이 아니라
`settings.md`의 "수면 설정" 섹션이다 — 여기는 수면 **트래킹/리포트**만 다룬다.

## 공통

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- 활성 가구 구성원 기준으로 동작한다. `accountId`를 path에 넣지 않는다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- daily report의 `date`는 수면 시작일 기준이다.
- daily report의 `date` 생략 시 가장 최근 완료된 수면 기록을 반환한다.
- weekly report의 `weekStart`는 반드시 월요일 날짜여야 한다.
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`

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
type ScoreFactor = {
  key: string;
  label: string;
  value: string;
  tag: string;
  tone: 'attention' | 'good' | 'excellent';
};

type StageBreakdown = {
  stage: 'awake' | 'rem' | 'light' | 'deep';
  label: string;
  percent: number;
  durationMinutes: number;
  durationText: string;
  tone: 'awake' | 'rem' | 'light' | 'deep';
  typicalPercentRange: [number, number];
};

type HypnogramSegment = {
  stage: 'awake' | 'light' | 'deep' | 'rem';
  durationMinutes: number;
};

type StageLogPoint = {
  time: string;
  stage: 'awake' | 'light' | 'deep' | 'rem';
  stageLabel: string;
  breathRate: number;
  heartRate: number;
  level: number;
};

type SnoringEpisode = {
  time: string;
  durationMinutes: number;
};

type AutomationSummary = {
  title: string;
  text: string;
};

type AnalysisItem = {
  label: string;
  value: string;
  description: string;
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
```

---

## GET `/sleep/today/summary`

메인 대시보드(`MainPage`)용 요약 카드.

**Response 200**
```json
{
  "date": "2026-07-02",
  "score": 82,
  "achievedHours": 7.0,
  "goalHours": 7.5,
  "bedTime": "23:42",
  "wakeTime": "06:42"
}
```

## GET `/sleep/today/plan`

오늘 밤 추천 수면 계획(`SleepPage`의 "오늘 밤 추천 수면 시간" 카드).

**Response 200**
```json
{
  "bedtime": "23:30",
  "wakeTime": "06:40",
  "prepTime": "22:50",
  "lightDimTime": "23:00",
  "recommendedTemperatureCelsius": 24
}
```

## GET `/sleep/today/phone-usage`

`SleepPage`의 "야간 스마트폰 사용 관리" 카드.

**Response 200**
```json
{
  "usedMinutes": 18,
  "goalMinutes": 10
}
```

## GET `/sleep/today/automation-summary`

`SleepPage`의 "오늘의 수면준비" 탭에서 수면 자동화 설정을 자연어로 요약해 보여주는 카드 목록.
`settings.md`의 "수면 설정"(`GET /settings/sleep`)에 저장된 값을 바탕으로 서버가 생성한 읽기 전용 요약이며, 사용자가 직접 수정하지 않는다(수정은 설정 화면에서 원본 값을 바꾸는 방식으로만 가능).

**Response 200**
```json
[
  {
    "title": "에어컨 자동 조절",
    "text": "취침 전엔 26℃로 살짝 낮추고, 수면 중에는 25℃를 유지해요. 기상 30분 전부터는 27℃까지 서서히 올려서 상쾌하게 깨워드려요."
  },
  {
    "title": "입면 조명 조절",
    "text": "취침 30분 전부터 조명이 서서히 어두워지기 시작해서, 취침 시각에는 밝기 10%까지 낮아져요."
  },
  {
    "title": "단계별 기상 알람",
    "text": "기상 30분 전엔 조명이 서서히 밝아지고, 15분 전엔 잔잔한 수면 음악이 흘러나오고, 기상 시각엔 알람이 울려요."
  },
  {
    "title": "야간 도파민 차단",
    "text": "야간에 스마트폰 사용이 감지되면 클래식 수면 음악이 자동으로 재생돼서 다시 잠들기 쉽도록 도와드려요."
  }
]
```

## GET `/sleep/reports/daily`

`date` 쿼리 파라미터로 특정 날짜의 수면 리포트를 조회한다(`StatusDateNavigator`가 날짜를 바꿀 때마다
호출). `date`는 수면 시작일 기준이고, 생략하면 가장 최근 완료된 수면 기록을 반환한다.

**Query** `?date=2026-07-01`

**Response 200**
```json
{
  "date": "2026-07-01",
  "score": 82,
  "sleepWindow": {
    "start": "2026-07-01T23:11:00+09:00",
    "end": "2026-07-02T06:36:00+09:00"
  },
  "timeInBedMinutes": 445,
  "actualSleepMinutes": 336,
  "scoreFactors": [
    {
      "key": "duration",
      "label": "총 수면 시간",
      "value": "5시간 36분",
      "tag": "주의",
      "tone": "attention"
    }
  ],
  "stageBreakdown": [
    {
      "stage": "deep",
      "label": "깊은 수면",
      "percent": 22,
      "durationMinutes": 74,
      "durationText": "1시간 14분",
      "tone": "deep",
      "typicalPercentRange": [15, 25]
    }
  ],
  "hypnogram": {
    "start": "2026-07-01T23:11:00+09:00",
    "end": "2026-07-02T06:36:00+09:00",
    "segments": [
      { "stage": "awake", "durationMinutes": 8 },
      { "stage": "light", "durationMinutes": 42 }
    ],
    "movementLevels": [42, 55, 61, 38, 12, 47]
  },
  "stageLog": [
    {
      "time": "23:11",
      "stage": "light",
      "stageLabel": "얕은 수면",
      "breathRate": 14,
      "heartRate": 68,
      "level": 1
    }
  ],
  "snoringEpisodes": [
    { "time": "02:14", "durationMinutes": 6 }
  ],
  "analysis": [
    {
      "label": "수면 점수",
      "value": "82점",
      "description": "전일 대비 +4점"
    }
  ]
}
```

`hypnogram.movementLevels`는 "수면 단계" 카드의 "움직임" 그래프에 쓰이는 상대적 움직임 강도(0~100)
샘플이다. `hypnogram.start`~`end` 구간에 걸쳐 균등한 간격으로 샘플링되며, 배열 길이는 고정되어 있지
않다(프론트는 받은 개수만큼 그린다).

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
{ "error": { "code": "NOT_FOUND", "message": "해당 날짜의 수면 기록이 없습니다." } }
```

## GET `/sleep/reports/weekly`

`weekStart` 쿼리로 해당 주(월요일 시작) 리포트를 조회한다. 생략 시 현재 주의 월요일 기준 리포트를 반환한다.
`weekStart`는 반드시 월요일 날짜여야 한다. `posture.md`와 동일하게 리포트 제목은 프론트가 고정 문구로
만든다 — 응답에 별도 `title` 필드는 없다.

**Query** `?weekStart=2026-06-29`

**Response 200**
```json
{
  "weekStart": "2026-06-29",
  "weekEnd": "2026-07-05",
  "score": 81,
  "summary": "주 후반 회복세를 보였어요.",
  "averageScore": 81,
  "trend": [
    { "date": "2026-06-29", "day": "월", "hours": 6.2, "score": 74 }
  ],
  "analysis": [
    {
      "label": "점수 변화",
      "value": "74→89점",
      "description": "주 후반 회복세"
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

## GET `/sleep/insights`

`period` 쿼리로 daily/weekly 인사이트를 조회한다.

**Query** `?period=daily`

**Response 200**
```json
[
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
```

**Query** `?period=weekly`

**Response 200**
```json
[
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
```

**Response 400**
```json
{ "error": { "code": "INVALID_PERIOD", "message": "period는 daily 또는 weekly여야 합니다." } }
```

---

## 공통 계약 — 인사이트 승인 (수면/자세/일정 공유)

`sleepData.js`/`postureData.js` 기반 추천 액션 카드는 세 도메인(수면/자세/일정)에서 동일한 `Insight`
엔티티를 공유한다. 승인/적용 토글은 이 엔드포인트 하나로 통일한다 — `posture.md`, `weekly-plan.md`는
이 계약을 그대로 재사용하고 별도로 정의하지 않는다.

### PATCH `/insights/{insightId}`

**Request Body**
```json
{ "approved": true }
```

**Response 200**
```json
{ "id": "ins_01J2ZQAF7E2X8M5K3D9R1V0ABC", "approved": true }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "인사이트를 찾을 수 없습니다." } }
```

## 전체 엔드포인트 요약

```http
GET /api/v1/sleep/today/summary
GET /api/v1/sleep/today/plan
GET /api/v1/sleep/today/phone-usage
GET /api/v1/sleep/today/automation-summary

GET /api/v1/sleep/reports/daily?date=2026-07-01
GET /api/v1/sleep/reports/weekly?weekStart=2026-06-29

GET /api/v1/sleep/insights?period=daily
GET /api/v1/sleep/insights?period=weekly

PATCH /api/v1/insights/{insightId}
```

## 프론트 API 메서드 시그니처 (구현 예정)

```js
sleepApi.getTodaySummary()
sleepApi.getTodayPlan()
sleepApi.getTodayPhoneUsage()
sleepApi.getTodayAutomationSummary()

sleepApi.getDailyReport(date)
sleepApi.getWeeklyReport(weekStart)

sleepApi.getInsights({ period })
sleepApi.updateInsight(insightId, { approved })
```

## 프론트 연동 지점 (구현 예정)

- `src/pages/sleep/SleepPage.js` → `/sleep/today/plan`, `/sleep/today/phone-usage`,
  `/sleep/today/automation-summary`
- `src/pages/sleep/SleepStatusReport.js` → `/sleep/reports/daily`
- `src/pages/sleep/SleepWeeklyReport.js` → `/sleep/reports/weekly`
- `src/pages/MainPage.js` → `/sleep/today/summary`
- 인사이트 카드(`src/components/report/InsightCard.js`) → `/sleep/insights?period=daily`,
  `/sleep/insights?period=weekly`, 승인 토글은 `PATCH /insights/{id}`
- Mock 시드 데이터: `src/data/sleepData.js`
