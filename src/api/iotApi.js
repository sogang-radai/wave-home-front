import { createApiClient } from '../lib/apiRouter';
import { IotApi as MockIotApi } from './mock/IotApi';
import { IotApi as RealIotApi } from './v1/IotApi';
import { IotApi as DemoIotApi } from './demo/IotApi';

const iotApi = createApiClient({
  mock: MockIotApi,
  real: RealIotApi,
  demo: DemoIotApi,
});
export default iotApi;
