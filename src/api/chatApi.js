import { ChatApi as MockChatApi } from './mock/ChatApi';
import { ChatApi as RealChatApi } from './v1/ChatApi';

// 채팅은 Gemini 연동 백엔드가 준비되어 있어 전역 USE_MOCK_API 스위치와 별도로 관리한다.
// REACT_APP_USE_MOCK_CHAT=true 를 넣으면 채팅만 다시 mock으로 되돌릴 수 있다.
const USE_MOCK_CHAT_API = process.env.REACT_APP_USE_MOCK_CHAT === 'true';
const ChatApiImpl = USE_MOCK_CHAT_API ? MockChatApi : RealChatApi;

const chatApi = new ChatApiImpl();
export default chatApi;
