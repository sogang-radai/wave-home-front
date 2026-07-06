# Common API Conventions

## Base URL

`/api/v1`

## 인증

```
Authorization: Bearer <access_token>
```

## 활성 구성원

`GET /session` → `{ "activeAccount": { "id": 1, "name": "…" } | null }`

활성 구성원이 없을 때 `409 ACTIVE_ACCOUNT_REQUIRED`.

## ID 규칙

| 리소스 | API id | 비고 |
|--------|--------|------|
| 구성원·방·할일·대화·메시지·알림·룰·IR·이벤트·인사이트 | INTEGER (JSON number) | DB `id` 그대로 |
| 장치 | string (16자 hex 등) | 물리 장비 식별자 |
| AI 모델 카탈로그 | string | `gemini-flash2.5` 등 |

- `external_id` 컬럼 없음.
- 방 **정렬 순서**는 API/DB에 없음 → `localStorage.wavehome_room_order` (INTEGER 배열).

## DB에 두지 않는 것

- **전력 breakpoint**: 백엔드 메모리 `deque` 등. 차트 API가 리샘플링.
- **대시보드** (`/dashboard/*`): 요청 시 합성 응답. DB 테이블 없음.

## IR 커맨드 저장

별도 테이블 없이 `automation_ir_store.commands_json` (JSON 배열). 항목 `id`는 INTEGER.

## 날짜·시간

- 날짜 파라미터: `YYYY-MM-DD`
- 타임스탬프 응답: ISO 8601
- 주간 리포트 `weekStart`: 해당 주 **월요일**

## SSE (채팅)

```
data: {"type":"content_delta","conversationId":1,"messageId":201,"text":"…"}

```
