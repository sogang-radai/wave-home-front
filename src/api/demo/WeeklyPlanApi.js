import { WeeklyPlanApi as RealWeeklyPlanApi } from '../v1/WeeklyPlanApi';

const realWeeklyPlanApi = new RealWeeklyPlanApi();

/** Demo: task writes use the server's isolated runtime session. Insight approve/apply also
 * go to the real backend now — applying a weekly_plan recommendation is what actually creates
 * the schedule_task/automation_rule, so "실행" needs to hit the real endpoint to sync with
 * the routine planner calendar and rule settings (previously simulated in memory only, which
 * looked like it worked but never persisted anything). */
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
    return realWeeklyPlanApi.createTask(payload);
  }

  updateTask(id, payload) {
    return realWeeklyPlanApi.updateTask(id, payload);
  }

  deleteTask(id) {
    return realWeeklyPlanApi.deleteTask(id);
  }

  updateInsight(insightId, payload) {
    return realWeeklyPlanApi.updateInsight(insightId, payload);
  }

  applyInsight(insightId) {
    return realWeeklyPlanApi.applyInsight(insightId);
  }
}
