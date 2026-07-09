import { ChatApi as MockChatApi, resetChatConversations } from '../mock/ChatApi';

// 일회성 채팅: 새로고침 시 대화 이력 없음. DB에도 저장하지 않음.
resetChatConversations([]);

export class ChatApi extends MockChatApi {}
