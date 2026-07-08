# WaveHome REST API (v1)

프론트엔드 `src/api/v1/*` · mock `src/api/mock/*` 와 1:1로 대응하는 백엔드 계약입니다.

- **Base URL**: `/api/v1`
- **인증**: `Authorization: Bearer <token>` (선택, 로컬 개발 시 생략 가능)
- **활성 구성원**: 대부분의 도메인은 세션의 `activeAccount` 기준으로 동작합니다.

## 문서 목록

| 문서 | 도메인 | 프론트 진입점 |
|------|--------|---------------|
| [common.md](./common.md) | 공통 규약·에러 | `src/api/v1/httpClient.js` |
| [settings.md](./settings.md) | 세션·계정·방·장치·설정·알림 | `settingsApi.js` |
| [sleep.md](./sleep.md) | 수면 트래킹·리포트 | `sleepApi.js` |
| [weekly-plan.md](./weekly-plan.md) | 주간 계획·루틴 | `weeklyPlanApi.js` |
| [alarm.md](./alarm.md) | 알람 | `alarmApi.js` |
| [insights.md](./insights.md) | 인사이트 승인 (공유) | `SleepApi` / `WeeklyPlanApi` |
| [dashboard.md](./dashboard.md) | 대시보드 메시지·현재 상태 | `dashboardApi.js` |
| [iot.md](./iot.md) | 가전 제어·룰·IR·이벤트 | `iotApi.js` |
| [power.md](./power.md) | 전력 모니터링·리포트 | `powerApi.js` |
| [chat.md](./chat.md) | WaveAI 대화 | `chatApi.js` |

## 제외

- **자세(posture)**: `posture.md` · `PostureApi` — 이번 백엔드 착수 범위에서 제외

## DB 스키마

- [`docs/db-schema.md`](../../../docs/db-schema.md) (리포 루트)

## Mock 전환

```bash
# mock (기본)
npm start

# real API
REACT_APP_USE_MOCK=false REACT_APP_API_BASE_URL=/api/v1 npm start
```

백엔드 구현 시 **mock 클래스를 스펙으로** 삼고, 이 문서의 요청·응답 예시와 일치시키면 프론트 변경 없이 전환됩니다.
