import { createApiClient } from '../lib/apiRouter';
import { GoalsApi as MockGoalsApi } from './mock/GoalsApi';
import { GoalsApi as RealGoalsApi } from './v1/GoalsApi';
import { GoalsApi as DemoGoalsApi } from './demo/GoalsApi';

const goalsApi = createApiClient({
  mock: MockGoalsApi,
  real: RealGoalsApi,
  demo: DemoGoalsApi,
});
export default goalsApi;
