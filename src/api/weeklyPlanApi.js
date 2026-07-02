import { USE_MOCK_API } from './config';
import { WeeklyPlanApi as MockWeeklyPlanApi } from './mock/WeeklyPlanApi';
import { WeeklyPlanApi as RealWeeklyPlanApi } from './v1/WeeklyPlanApi';

const WeeklyPlanApiImpl = USE_MOCK_API ? MockWeeklyPlanApi : RealWeeklyPlanApi;

const weeklyPlanApi = new WeeklyPlanApiImpl();
export default weeklyPlanApi;
