import { DashboardApi as MockDashboardApi } from '../mock/DashboardApi';
import { DashboardApi as RealDashboardApi } from '../v1/DashboardApi';

const realDashboardApi = new RealDashboardApi();

export class DashboardApi extends MockDashboardApi {
  async getDailyMessage() {
    try {
      return await realDashboardApi.getDailyMessage();
    } catch {
      return null;
    }
  }
}
