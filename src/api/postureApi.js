import { createApiClient } from '../lib/apiRouter';
import { PostureApi as MockPostureApi } from './mock/PostureApi';
import { PostureApi as RealPostureApi } from './v1/PostureApi';
import { PostureApi as DemoPostureApi } from './demo/PostureApi';

const postureApi = createApiClient({
  mock: MockPostureApi,
  real: RealPostureApi,
  demo: DemoPostureApi,
});
export default postureApi;
