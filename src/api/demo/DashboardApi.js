import { DashboardApi as MockDashboardApi } from '../mock/DashboardApi';
import { DashboardApi as RealDashboardApi } from '../v1/DashboardApi';

const realDashboardApi = new RealDashboardApi();

async function preferReal(method, fallback) {
  try {
    return await method.call(realDashboardApi);
  } catch {
    return fallback();
  }
}

export class DashboardApi extends MockDashboardApi {
  async getDailyMessage() {
    return preferReal(realDashboardApi.getDailyMessage, () => super.getDailyMessage());
  }

  async getCurrentState() {
    return preferReal(realDashboardApi.getCurrentState, () => super.getCurrentState());
  }

  async getUpcomingAlarms() {
    return preferReal(realDashboardApi.getUpcomingAlarms, () => super.getUpcomingAlarms());
  }

  async getActiveGestureRules() {
    return preferReal(realDashboardApi.getActiveGestureRules, () => super.getActiveGestureRules());
  }
}
