import { createApiClient } from '../lib/apiRouter';
import { SleepApi as MockSleepApi } from './mock/SleepApi';
import { SleepApi as RealSleepApi } from './v1/SleepApi';
import { SleepApi as DemoSleepApi } from './demo/SleepApi';

const sleepApi = createApiClient({
  mock: MockSleepApi,
  real: RealSleepApi,
  demo: DemoSleepApi,
});
export default sleepApi;
