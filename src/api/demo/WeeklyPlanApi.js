import { WeeklyPlanApi as MockWeeklyPlanApi } from '../mock/WeeklyPlanApi';
import { WeeklyPlanApi as RealWeeklyPlanApi } from '../v1/WeeklyPlanApi';
import { withDemoWriteGuard } from './guardedApi';

const realWeeklyPlanApi = new RealWeeklyPlanApi();
const GuardedWeeklyPlanApi = withDemoWriteGuard(MockWeeklyPlanApi, [
  'createTask',
  'updateTask',
  'deleteTask',
  'updateInsight',
  'applyInsight',
]);
const guardedWeeklyPlanApi = new GuardedWeeklyPlanApi();

/** Demo: schedule/recommendations/report reads from DB; writes stay guarded (no persistence). */
export class WeeklyPlanApi {
  getTasks(query) {
    return realWeeklyPlanApi.getTasks(query);
  }

  getWeeklyAgentReport(query) {
    return realWeeklyPlanApi.getWeeklyAgentReport(query);
  }

  getRecommendations() {
    return realWeeklyPlanApi.getRecommendations();
  }

  createTask(payload) {
    return guardedWeeklyPlanApi.createTask(payload);
  }

  updateTask(id, payload) {
    return guardedWeeklyPlanApi.updateTask(id, payload);
  }

  deleteTask(id) {
    return guardedWeeklyPlanApi.deleteTask(id);
  }

  updateInsight(insightId, payload) {
    return guardedWeeklyPlanApi.updateInsight(insightId, payload);
  }

  applyInsight(insightId) {
    return guardedWeeklyPlanApi.applyInsight(insightId);
  }
}
