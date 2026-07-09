# WaveHome REST API (v1)

프론트엔드 `src/api/v1/*` · mock `src/api/mock/*` 와 1:1로 대응하는 백엔드 계약입니다.

- **Base URL**: `/api/v1`
- **인증**: `Authorization: Bearer <token>` (선택, 로컬 개발 시 생략 가능)
- **활성 구성원**: 대부분의 도메인은 세션의 `activeAccount` 기준으로 동작합니다.

## 변경 내역 (2026-07-08)

| 문서 | 변경 |
|------|------|
| [schedule-tasks.md](./schedule-tasks.md) | **신규** — `routine_task` → `schedule_task`, `scheduleKind`·`eventDate` |
| [insights.md](./insights.md) | **갱신** — `surface`/`date`, `ruleJson`·`scheduleTaskJson`, `POST …/apply` 원탭 적용 |
| [weekly-plan.md](./weekly-plan.md) | **갱신** — 배너(`weekly_plan_report`, metrics 없음) + schedule-tasks·insights 분리 |
| [iot.md](./iot.md) | **신규** — 프론트 룰 API (`/iot/rules`). 에이전트 룰은 [device-tool-api.md](../../../docs/agent-api/device-tool-api.md) |
| [alarm.md](./alarm.md) | 유지 — DB `alarm` CRUD (백엔드 미구현) |
| [db-schema.md](../../../docs/db-schema.md) | 인사이트·일정·알람·리포트 전면 반영 |
| **프론트 경로 정렬** | `schedule-tasks`, `weekly-plan/report`, 통합 `insights` API (`insightsApi.js`) |
| [agent-api](../../../docs/agent-api/README.md) | 에이전트용 `schedule-tasks`·`alarms`·`rules` internal API 문서 추가 |

## 룰·일정·알람 엔드포인트 요약

| 도메인 | 엔드포인트 | 문서 | 백엔드 |
|--------|-----------|------|--------|
| IoT 룰·예약 | `GET/POST /api/v1/iot/rules`, `PUT/DELETE …/{ruleId}`, … | [iot.md](./iot.md) | **일부 구현** |
| 주간·1회 일정 | `GET/POST /api/v1/schedule-tasks`, `PATCH/DELETE …/{id}` | [schedule-tasks.md](./schedule-tasks.md) | 미구현 |
| 알람 | `GET/POST /api/v1/alarms`, `PATCH/DELETE …/{id}` | [alarm.md](./alarm.md) | 미구현 |

에이전트가 동일 도메인을 호출할 때는 `/internal/v1/*` — [`docs/agent-api/README.md`](../../../docs/agent-api/README.md) 의 매핑 표 참고.

## 문서 표기 규칙

- Base URL: `/api/v1` (`http://<backend>:8500/api/v1`)
- 섹션 제목·요약 블록의 엔드포인트는 **full path** (`/api/v1/...`) 로 통일한다.
- 공통 에러·인증 규약은 [settings.md](./settings.md) 상단을 따른다.

## 문서 목록

| 문서 | 도메인 | 프론트 진입점 | 비고 |
|------|--------|---------------|------|
| [settings.md](./settings.md) | 세션·계정·방·장치·설정·알림 | `settingsApi.js` | 공통 규약 포함 |
| [weekly-plan.md](./weekly-plan.md) | 주간 계획·배너·추천 | `weeklyPlanApi.js` | |
| [schedule-tasks.md](./schedule-tasks.md) | 루틴·일정(TODO) | `weeklyPlanApi.js` | |
| [alarm.md](./alarm.md) | 알람 | `alarmApi.js` | 백엔드 미구현 |
| [insights.md](./insights.md) | 인사이트 조회·적용 | `insightsApi.js` + 도메인 API | 백엔드 미구현 |
| [dashboard.md](./dashboard.md) | 대시보드 메시지·현재 상태 | `dashboardApi.js` | 백엔드 미구현 |
| [iot.md](./iot.md) | 가전 제어·룰 | `iotApi.js` | 룰 일부 구현 |
| [power.md](./power.md) | 전력 모니터링·리포트 | `powerApi.js` | plugs·combo 일부 구현 |

### 미작성 (추후 추가)

| 도메인 | 프론트 진입점 | 비고 |
|--------|---------------|------|
| 수면 | `sleepApi.js` | mock 기준, API 문서 미작성 |
| WaveAI 대화 | `chatApi.js` | 백엔드 프록시·에이전트 연동 후 작성 |

## 제외

- **자세(posture)**: 프론트 API — 백엔드 착수 범위 제외. 에이전트 경로만 [posture-analysis-api.md](../../../docs/agent-api/posture-analysis-api.md) 예약.

## DB 스키마

- [`docs/db-schema.md`](../../../docs/db-schema.md) (리포 루트)

## 에이전트 연동

- [`docs/agent-api/README.md`](../../../docs/agent-api/README.md) — DB 조회·RAG·인사이트/리포트 생성 (백엔드 → 에이전트)

## Mock 전환

```bash
# mock (기본)
npm start

# real API
REACT_APP_USE_MOCK=false REACT_APP_API_BASE_URL=/api/v1 npm start
```

백엔드 구현 시 **mock 클래스를 스펙으로** 삼고, 이 문서의 요청·응답 예시와 일치시키면 프론트 변경 없이 전환됩니다.
