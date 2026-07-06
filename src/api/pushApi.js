import { USE_MOCK_API } from './config';
import { PushApi as MockPushApi } from './mock/PushApi';
import { PushApi as RealPushApi } from './v1/PushApi';

const PushApiImpl = USE_MOCK_API ? MockPushApi : RealPushApi;

const pushApi = new PushApiImpl();
export default pushApi;
