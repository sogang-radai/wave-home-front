import { USE_MOCK_API } from './config';
import { ChatApi as MockChatApi } from './mock/ChatApi';
import { ChatApi as RealChatApi } from './v1/ChatApi';

const ChatApiImpl = USE_MOCK_API ? MockChatApi : RealChatApi;

const chatApi = new ChatApiImpl();
export default chatApi;
