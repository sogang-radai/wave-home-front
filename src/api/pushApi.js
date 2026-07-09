import { createApiClient } from '../lib/apiRouter';
import { PushApi as MockPushApi } from './mock/PushApi';
import { PushApi as RealPushApi } from './v1/PushApi';
import { PushApi as DemoPushApi } from './demo/PushApi';

const pushApi = createApiClient({
  mock: MockPushApi,
  real: RealPushApi,
  demo: DemoPushApi,
});
export default pushApi;
