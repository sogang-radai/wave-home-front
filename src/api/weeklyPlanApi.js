import { createApiClient } from '../lib/apiRouter';
import { WeeklyPlanApi as MockWeeklyPlanApi } from './mock/WeeklyPlanApi';
import { WeeklyPlanApi as RealWeeklyPlanApi } from './v1/WeeklyPlanApi';
import { WeeklyPlanApi as DemoWeeklyPlanApi } from './demo/WeeklyPlanApi';

const weeklyPlanApi = createApiClient({
  mock: MockWeeklyPlanApi,
  real: RealWeeklyPlanApi,
  demo: DemoWeeklyPlanApi,
});
export default weeklyPlanApi;
