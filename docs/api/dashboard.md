# Dashboard API (메인 대시보드)

구현된 프론트 코드: `src/api/dashboardApi.js`(진입점) · `src/api/mock/DashboardApi.js`(mock) ·
`src/api/v1/DashboardApi.js`(real).

`src/pages/MainPage.js` 상단의 히어로 인사말 배너와 "현재 상태" 카드에서 쓰는 데이터를 다룬다. 이 두
위젯은 수면·자세·가전 데이터를 한 문장/한 카드로 요약해서 보여주는 대시보드 전용 콘텐츠라 특정 도메인
(`sleep.md`/`posture.md`/`iot.md`) 소관으로 넣지 않고 별도 문서로 뗐다. 대시보드의 다른 카드(어젯밤
수면, 자세 점수, 전력 분석, 오늘 할일)는 각자 `sleep.md`/`posture.md`/`iot.md`/`weekly-plan.md`를
그대로 쓴다 — 여기서 새로 정의하지 않는다.

## 공통

- Base URL: `/api/v1`
- 현재 세션의 `activeAccount` 기준으로 조회한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 응답은 **요청 시 백엔드가 합성**한다. 별도 DB 테이블 없음(필요 시 서버 메모리 TTL 캐시만).
- `radar`는 `iot.md`의 `GET /iot/radars` 목록 중 하나를 대표로 보여주는 요약이다. 목록 전체가
  필요하면 `iot.md`를 그대로 쓴다.
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

---

## 전체 엔드포인트 요약

```http
GET /api/v1/dashboard/daily-message
GET /api/v1/dashboard/current-state
```

## 프론트 API 메서드 시그니처 (구현 예정)

```js
dashboardApi.getDailyMessage()
dashboardApi.getCurrentState()
```

## 프론트 연동 지점 (구현 예정)

- `src/pages/MainPage.js` → 히어로 배너는 `getDailyMessage()`, "현재 상태" 카드의 실내 환경/가전
  제어 모드/레이더 연결 상태는 `getCurrentState()`. 같은 카드의 자세 점수는 기존대로
  `postureApi.getTodaySummary()`를 그대로 쓴다.
- Mock 시드 데이터: `src/data/overviewData.js`의 `dailyMessage`.
