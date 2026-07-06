# Power API (전력 관리)

구현된 프론트 코드: `src/api/powerApi.js` · `src/api/mock/PowerApi.js` · `src/api/v1/PowerApi.js`

`src/pages/power/PowerPage.js`, `src/pages/MainPage.js` 전력 카드에서 사용합니다.

DB: `docs/db-schema.md`의 `power_energy`, `power_report`.

## 공통

- [common.md](./common.md) 규약 준수
- `deviceId`에 `'all'`을 넘기면 계측 플러그 합산 소스를 의미합니다 (`power_energy.device_id IS NULL`과 동일)

---

## GET `/power/plugs`

스마트 플러그 목록과 대시보드용 스파크라인 시드.

**Response 200**
```json
[
  {
    "id": "all",
    "name": "전체",
    "room": "집합",
    "summary": "계측 플러그 합산",
    "powerW": 842.5,
    "voltageV": 220.1,
    "currentMa": 3820,
    "switchOn": true,
    "hourlyCostWon": 210.6,
    "trend": {
      "tenSec": [{ "label": "지금", "value": 840.2 }],
      "hour": [{ "label": "-55분", "value": 720.0 }]
    }
  },
  {
    "id": "1f8c5a2e7b93064d",
    "name": "거실 에어컨",
    "room": "거실",
    "summary": "대기 전력 포함",
    "powerW": 620.0,
    "voltageV": 221.0,
    "currentMa": 2805,
    "switchOn": true,
    "hourlyCostWon": 155.0,
    "trend": { "tenSec": [], "hour": [] }
  }
]
```

> 하위 호환: `HomeApi.getPowerPlugs()`는 동일 엔드포인트를 호출합니다 (`@deprecated`).

---

## GET `/power/trend/combo`

단기 콤보 차트 (1분·10분·30분·1시간).

**Query**

| 이름 | 필수 | 설명 |
|------|------|------|
| `deviceId` | ✅ | 플러그 id 또는 `all` |
| `range` | ✅ | `min1` \| `min10` \| `min30` \| `hour` |
| `metric` | | `w` \| `v` \| `a` \| `wh` (기본 `w`) |

**Response 200**
```json
[
  { "label": "-59s", "value": 612.4, "wh": 0.0102 }
]
```

- `wh` 필드는 `metric=wh` 또는 복합 차트용으로 포함합니다.

---

## GET `/power/trend/period`

일·주·월·연 기간 차트.

**Query**

| 이름 | 필수 | 설명 |
|------|------|------|
| `deviceId` | ✅ | |
| `period` | ✅ | `day` \| `week` \| `month` \| `year` |
| `metric` | | `w` \| `wh` (기본 `wh`) |

**Response 200**
```json
[
  { "label": "월", "value": 3.82, "wh": 3820.5 }
]
```

---

## GET `/power/reports`

AI/요약 리포트 배너. `power_report.period`와 동일한 단위만 지원합니다.

**Query**

| 이름 | 필수 | 설명 |
|------|------|------|
| `deviceId` | ✅ | |
| `period` | ✅ | `1h` \| `24h` \| `1w` \| `1mo` \| `1yr` |
| `periodStart` | | 구간 시작. 생략 시 현재 시점 기준 최신 |

**Response 200** — 지원 구간
```json
{
  "supported": true,
  "period": "24h",
  "periodStart": "2026-07-06",
  "metrics": {
    "energyWh": 3820.5,
    "peakW": 1180.4,
    "peakAt": "2026-07-05 22:05:00",
    "onRatio": 0.34,
    "vsPrevPct": 12.3
  },
  "reportText": "오늘 총 사용량은 3.82kWh…"
}
```

**Response 200** — 미지원 구간 (예: combo `min1`)
```json
{
  "supported": false,
  "text": "이 구간에서는 AI 리포트를 제공하지 않습니다."
}
```

---

## 백엔드 구현 노트

1. `power_breakpoint`에서 최근 구간을 리샘플링해 combo/period API를 채운다.
2. `power_energy` 롤업이 준비되면 period 차트의 기본 소스로 사용한다.
3. `reportText`는 `power_report.report_text`(LLM)가 NULL이면 `metrics`만으로 템플릿 요약을 생성해도 된다.
