import { API_MODE } from './config';
import { ChatApi as MockChatApi } from './mock/ChatApi';
import { ChatApi as RealChatApi } from './v1/ChatApi';
import { ChatApi as DemoChatApi } from './demo/ChatApi';

// 채팅은 전역 API_MODE와 별도로 REACT_APP_USE_MOCK_CHAT=true 이면 mock을 강제한다.
const forceMockChat = process.env.REACT_APP_USE_MOCK_CHAT === 'true';

function resolveChatApiClass() {
  if (forceMockChat) return MockChatApi;
  if (API_MODE === 'demo') return DemoChatApi;
  if (API_MODE === 'real') return RealChatApi;
  return MockChatApi;
}

const chatApi = new (resolveChatApiClass())();
export default chatApi;
