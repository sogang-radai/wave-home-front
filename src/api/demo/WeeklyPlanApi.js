import { WeeklyPlanApi as MockWeeklyPlanApi } from '../mock/WeeklyPlanApi';
import { withDemoWriteGuard } from './guardedApi';

export const WeeklyPlanApi = withDemoWriteGuard(MockWeeklyPlanApi, [
  'createTask',
  'updateTask',
  'deleteTask',
  'updateInsight',
  'applyInsight',
]);
