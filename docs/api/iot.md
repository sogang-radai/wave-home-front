# IoT API (가전 제어·룰)

프론트 진입점: `iotApi.js` · `src/api/v1/IotApi.js` · `src/api/mock/IotApi.js`.

> 에이전트 서버용 룰 API는 **별도** ([`docs/agent-api/device-tool-api.md`](../../../docs/agent-api/device-tool-api.md), `/internal/v1/rules`). 이 문서는 **웹 프론트 ↔ 백엔드** (`/api/v1/iot/*`) 만 다룬다.

## 공통

- Base URL: `/api/v1`
- 룰 런타임 저장: SQLite `automation_rule` (`external_id` = API `ruleId`)

## Rules — 트리거·예약

`trigger` 만 있으면 자동화, `schedule` 만 있으면 예약. 타입은 [`docs/agent-api/device-tool-api.md`](../../../docs/agent-api/device-tool-api.md) 의 `Rule`, `RuleView`.

### GET `/iot/rules`

**Query**: `deviceId` (선택)

**Response 200** — `RuleView[]`

### POST `/iot/rules`

**Response 201** — `RuleView`

### PUT `/iot/rules/{ruleId}`

부분 수정. **Response 200** — `RuleView`

### DELETE `/iot/rules/{ruleId}`

예약 취소 포함. **Response 200** `{ "id": "rule_..." }`

### PUT `/iot/rules/{ruleId}/enabled`

```json
{ "enabled": false }
```

### POST `/iot/rules/{ruleId}/execute`

수동 1회 실행.

## 인사이트 연동

`POST /insights/{id}/apply` (`actionType` = `automation_rule` | `reservation`) 가 `insight.ruleJson` 을 검증 후 동일 RuleStore 경로로 등록한다.

## 엔드포인트 요약 (룰)

```http
GET    /api/v1/iot/rules
POST   /api/v1/iot/rules
PUT    /api/v1/iot/rules/{ruleId}
DELETE /api/v1/iot/rules/{ruleId}
PUT    /api/v1/iot/rules/{ruleId}/enabled
POST   /api/v1/iot/rules/{ruleId}/execute
```

## 프론트 API

```js
iotApi.getRules()
iotApi.createRule(rule)
iotApi.updateRule(ruleId, patch)
iotApi.deleteRule(ruleId)
iotApi.setRuleEnabled(ruleId, enabled)
iotApi.executeRule(ruleId)
```

기타 IoT(장치 목록·제어·IR·이벤트)는 mock `IotApi` 및 wave-server `IotController` 구현을 스펙으로 삼는다.

### 장치 클래스·capabilities

8종 전체 action/query/예약·트리거 매트릭스는 [`docs/agent-api/device-tool-api.md`](../../../docs/agent-api/device-tool-api.md) 의 **장치 클래스 개요**·**클래스별 레퍼런스** 참고.

| class | 조작 | 쿼리 | 예약 | 비고 |
|-------|:--:|:--:|:--:|------|
| `tuya_ep2h` | on/off/toggle | power, voltage, … | ✓ | 전력 트리거 |
| `philips_wiz_e29_color` | brightness, color | state, brightness | ✓ | |
| `philips_wiz_e29_white` | brightness, temperature | state, temperature | ✓ | |
| `samsung_g7` | TV 리모컨·앱 | state, inputs | ✓ | `tizen_tv` 별칭 |
| `wave_station` | send_ir, subscribe | env, mic_level | ✓ | IR 수신 트리거 |
| `reolink_e1_pro` | — | stream, status | — | PTZ·stream·TTS 보조 API |
| `droid_cam` | — | stream, status | — | stream·TTS 보조 API |
| `srs_r4sn` | — | point_cloud, iq | — | 제스처 트리거 전용 |

**IR**: 커맨드 **조회**는 `GET /api/v1/iot/ir-commands`(전역). **송신**은 Wave Station `POST /api/v1/iot/devices/{waveStationId}/actions/send_ir` 만 (`testSendIr` 포함). 상세는 [`device-tool-api.md`](../../../docs/agent-api/device-tool-api.md) 적외선 섹션.
