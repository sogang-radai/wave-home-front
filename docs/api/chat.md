# Chat API

구현된 프론트 코드: `src/api/chatApi.js` · `src/api/mock/ChatApi.js` · `src/api/v1/ChatApi.js`.

WaveAI 대화 페이지(`src/pages/chat/ChatPage.js`), 팝업 챗(`src/pages/chat/ChatPopup.js`), 사이드 인사이트 위젯
(`src/pages/chat/InsightChat.js`)에서 쓰는 대화/메시지/추천 질문/1회성 인사이트 질의를 다룬다.

## 공통

- Base URL: `/api/v1`
- 대화 목록과 메시지는 현재 세션의 `activeAccount` 기준으로 조회/생성/수정/삭제한다.
- `activeAccount`가 설정되지 않은 경우 `409 ACTIVE_ACCOUNT_REQUIRED`를 반환한다.
- 공통 에러 응답: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`
- 실제 백엔드는 답변 생성 시 Gemini API를 호출한다. 이때 활성 구성원의 수면/자세/심박 등 최근 데이터를
  컨텍스트로 넣는 방식이 권장된다.
- mock은 `src/data/chatData.js`의 `getInsightReply()` 키워드 매칭(수면/자세/심박/레이더)으로 답변을 흉내낸다.

**Response 409**
```json
{
  "error": {
    "code": "ACTIVE_ACCOUNT_REQUIRED",
    "message": "활성 구성원을 먼저 선택해주세요."
  }
}
```

**Response 502**
```json
{
  "error": {
    "code": "AI_PROVIDER_ERROR",
    "message": "AI 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."
  }
}
```

**Response 504**
```json
{
  "error": {
    "code": "AI_TIMEOUT",
    "message": "AI 응답 생성 시간이 초과되었습니다."
  }
}
```

## 타입

```ts
type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

type ConversationSummary = {
  id: number;
  title: string;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type Conversation = {
  id: number;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type MessageAppendResponse = {
  conversationId: number;
  appendedMessages: ChatMessage[];
  conversation: Pick<Conversation, 'id' | 'title' | 'updatedAt'>;
};

type SuggestionChip = {
  id: number;
  icon?: string;
  label: string;
  prompt: string;
};

type ChatSuggestions = {
  insightSuggestions: SuggestionChip[];
  suggestionPool: SuggestionChip[];
};
```

---

## GET `/chat/conversations`

활성 구성원의 대화 목록을 최신순으로 반환한다. 목록에서는 메시지 전체가 아니라 summary만 내려준다.

**Response 200**
```json
[
  {
    "id": 1,
    "title": "수면 분석 질문",
    "lastMessagePreview": "어젯밤 수면 데이터를 바탕으로 도와드릴게요.",
    "messageCount": 8,
    "createdAt": "2026-07-01T23:10:00+09:00",
    "updatedAt": "2026-07-02T15:20:00+09:00"
  }
]
```

## GET `/chat/conversations/{conversationId}`

대화 상세와 메시지 전체를 조회한다.

**Response 200**
```json
{
  "id": 1,
  "title": "수면 분석 질문",
  "messages": [
    {
      "id": 101,
      "role": "assistant",
      "text": "어젯밤 수면 데이터를 바탕으로 도와드릴게요.",
      "createdAt": "2026-07-02T15:20:00+09:00"
    }
  ],
  "createdAt": "2026-07-01T23:10:00+09:00",
  "updatedAt": "2026-07-02T15:20:00+09:00"
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "대화를 찾을 수 없습니다." } }
```

## POST `/chat/conversations`

새 대화를 생성한다. 빈 대화 생성과 첫 메시지를 포함한 대화 생성을 모두 허용한다.

**Request Body** — 빈 대화 생성
```json
{ "title": "새 대화" }
```

**Request Body** — 첫 메시지와 함께 생성
```json
{ "initialMessage": "어젯밤 왜 잠을 못 잤을까?" }
```

**Response 201**
```json
{
  "id": 4,
  "title": "어젯밤 왜 잠을 못 잤을까?",
  "messages": [
    {
      "id": 102,
      "role": "user",
      "text": "어젯밤 왜 잠을 못 잤을까?",
      "createdAt": "2026-07-02T15:20:00+09:00"
    },
    {
      "id": 103,
      "role": "assistant",
      "text": "어젯밤은 입면 시간이 길어지고 새벽 온도 상승 구간에서 뒤척임이 늘어난 패턴이 보여요.",
      "createdAt": "2026-07-02T15:20:02+09:00"
    }
  ],
  "createdAt": "2026-07-02T15:20:00+09:00",
  "updatedAt": "2026-07-02T15:20:02+09:00"
}
```

**Response 400**
```json
{ "error": { "code": "INVALID_TITLE", "message": "대화 제목 또는 첫 메시지를 입력해주세요.", "field": "title" } }
```

## PATCH `/chat/conversations/{conversationId}`

대화 제목을 변경한다.

**Request Body**
```json
{ "title": "수면 리포트 질문" }
```

**Response 200**
```json
{
  "id": 1,
  "title": "수면 리포트 질문",
  "lastMessagePreview": "어젯밤 수면 데이터를 바탕으로 도와드릴게요.",
  "messageCount": 8,
  "createdAt": "2026-07-01T23:10:00+09:00",
  "updatedAt": "2026-07-02T15:20:00+09:00"
}
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "대화를 찾을 수 없습니다." } }
```

## DELETE `/chat/conversations/{conversationId}`

대화를 삭제한다.

**Response 204** — 본문 없음

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "대화를 찾을 수 없습니다." } }
```

## POST `/chat/conversations/{conversationId}/messages`

기존 대화에 사용자 메시지를 추가하고 assistant 답변을 생성한다.

**Request Body**
```json
{ "text": "그러면 오늘 밤은 어떻게 하면 좋아?" }
```

**Response 200**
```json
{
  "conversationId": 1,
  "appendedMessages": [
    {
      "id": 104,
      "role": "user",
      "text": "그러면 오늘 밤은 어떻게 하면 좋아?",
      "createdAt": "2026-07-02T15:25:00+09:00"
    },
    {
      "id": 105,
      "role": "assistant",
      "text": "오늘 밤은 취침 30분 전부터 조명을 낮추고, 실내 온도를 24도로 유지하는 것이 좋아요.",
      "createdAt": "2026-07-02T15:25:02+09:00"
    }
  ],
  "conversation": {
    "id": 1,
    "title": "수면 분석 질문",
    "updatedAt": "2026-07-02T15:25:02+09:00"
  }
}
```

**Response 400**
```json
{ "error": { "code": "INVALID_MESSAGE", "message": "메시지를 입력해주세요.", "field": "text" } }
```

**Response 400**
```json
{ "error": { "code": "MESSAGE_TOO_LONG", "message": "메시지는 2000자 이하로 입력해주세요.", "field": "text" } }
```

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "대화를 찾을 수 없습니다." } }
```

---

## POST `/chat/conversations/{conversationId}/messages/stream`

## POST `/chat/conversations/stream`

`App.js` 메인 채팅 입력이 사용하는 **SSE 스트리밍** 엔드포인트.

- 기존 대화: `POST /chat/conversations/{conversationId}/messages/stream`
- 새 대화: `conversationId`가 `null`이면 `POST /chat/conversations/stream`

**Headers**
```
Accept: text/event-stream
Content-Type: application/json
```

**Request Body**
```json
{ "text": "어젯밤 수면 점수 알려줘" }
```

**Response** — `text/event-stream`, 각 이벤트는 한 줄 `data: {json}` + 빈 줄.

### 이벤트 타입

| type | 설명 |
|------|------|
| `user_added` | 새 대화 생성 시. `conversation`, `message` 포함 |
| `assistant_start` | assistant 메시지 껍데기 (`status: "streaming"`) |
| `tool_start` / `tool_end` | 도구 호출 (선택) |
| `reasoning_delta` | 추론 텍스트 증분 |
| `content_delta` | 답변 텍스트 증분 (`text` 누적값) |
| `message_done` | 스트리밍 완료 |

**예시**
```
data: {"type":"content_delta","conversationId":1,"messageId":201,"text":"어젯밤 "}

data: {"type":"message_done","conversationId":1,"messageId":201,"text":"어젯밤 수면 점수는 82점입니다."}

```

프론트 `ChatApi.sendMessageStreaming(conversationId, text, { onEvent, onComplete, onError })`는 위 이벤트를 그대로 `onEvent`로 전달한다. 반환값은 `abort()` 함수.

**Response 400/404/502/504** — 스트림 시작 전 JSON 에러 (일반 에러 형식)

---

## GET `/chat/suggestions`

빈 대화 화면(웰컴 카드), 팝업 챗, 사이드 인사이트 위젯에서 보여줄 추천 질문 목록을 반환한다.
`insightSuggestions`와 `suggestionPool`은 모두 `SuggestionChip[]` 형태를 쓴다.

**Response 200**
```json
{
  "insightSuggestions": [
    {
      "id": "sug_insight_sleep_today",
      "label": "오늘 수면 인사이트 알려줘",
      "prompt": "오늘 수면 인사이트 알려줘"
    }
  ],
  "suggestionPool": [
    {
      "id": "sug_welcome_sleep_analysis",
      "icon": "moon",
      "label": "수면 분석",
      "prompt": "어젯밤 수면에서 가장 아쉬운 점을 알려줘"
    }
  ]
}
```

## POST `/chat/insight-queries`

대화 이력을 남기지 않는 1회성 질의응답. 사이드바에 떠 있는 `InsightChat` 위젯 전용이다.
여러 화면에서 질문 1개를 가볍게 던지고 답만 받는 용도라 대화 메시지 생성과 분리했다.

**Request Body**
```json
{ "text": "오늘 수면 인사이트 알려줘" }
```

**Response 200**
```json
{ "reply": "오늘은 수면 목표까지 30분 정도 부족했어요. 취침 전 스마트폰 사용을 10분 이하로 줄이는 쪽이 가장 효과적입니다." }
```

**Response 400**
```json
{ "error": { "code": "INVALID_MESSAGE", "message": "메시지를 입력해주세요.", "field": "text" } }
```

---

## 전체 엔드포인트 요약

```http
GET    /api/v1/chat/conversations
POST   /api/v1/chat/conversations
GET    /api/v1/chat/conversations/{conversationId}
PATCH  /api/v1/chat/conversations/{conversationId}
DELETE /api/v1/chat/conversations/{conversationId}

POST   /api/v1/chat/conversations/{conversationId}/messages
POST   /api/v1/chat/conversations/{conversationId}/messages/stream
POST   /api/v1/chat/conversations/stream

GET    /api/v1/chat/suggestions
POST   /api/v1/chat/insight-queries
```

## 프론트 API 메서드 시그니처

```js
chatApi.getConversations()
chatApi.getConversation(conversationId)

chatApi.createConversation({ title })
chatApi.startConversation(text)

chatApi.renameConversation(conversationId, title)
chatApi.deleteConversation(conversationId)

chatApi.sendMessage(conversationId, text)
chatApi.sendMessageStreaming(conversationId, text, { onEvent, onComplete, onError })

chatApi.getSuggestions()
chatApi.askInsight(text)
```

## 프론트 연동 지점

- `src/App.js` — `chatConversations`/`activeChatId` 상태를 `getConversations`/`getConversation`/
  `createConversation`/`startConversation`/`renameConversation`/`deleteConversation`/`sendMessage`로 관리한다
  (`ChatPage`, `ChatPopup`에 props로 전달).
- `src/pages/chat/ChatPage.js`, `src/pages/chat/ChatPopup.js` — 웰컴 화면 추천 질문을 `getSuggestions()`로 로드한다.
- `src/pages/chat/InsightChat.js` — 추천 칩은 `getSuggestions()`, 질문 전송은 `askInsight()`를 사용한다.
- Mock 시드 데이터: `src/data/chatData.js` (mock 클래스의 응답 재료로 사용).
