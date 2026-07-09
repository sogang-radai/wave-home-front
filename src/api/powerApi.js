import { createApiClient } from '../lib/apiRouter';
import { PowerApi as MockPowerApi } from './mock/PowerApi';
import { PowerApi as RealPowerApi } from './v1/PowerApi';
import { PowerApi as DemoPowerApi } from './demo/PowerApi';

const powerApi = createApiClient({
  mock: MockPowerApi,
  real: RealPowerApi,
  demo: DemoPowerApi,
});
export default powerApi;
