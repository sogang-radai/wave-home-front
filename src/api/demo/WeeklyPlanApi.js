import { WeeklyPlanApi as MockWeeklyPlanApi } from '../mock/WeeklyPlanApi';
import { WeeklyPlanApi as RealWeeklyPlanApi } from '../v1/WeeklyPlanApi';

const realWeeklyPlanApi = new RealWeeklyPlanApi();
const mockWeeklyPlanApi = new MockWeeklyPlanApi();

/** Demo: task writes use the server's isolated runtime session; insight decisions stay in-memory. */
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
    return mockWeeklyPlanApi.updateInsight(insightId, payload);
  }

  applyInsight(insightId) {
    return mockWeeklyPlanApi.applyInsight(insightId);
  }
}
