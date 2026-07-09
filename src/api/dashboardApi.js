import { createApiClient } from '../lib/apiRouter';
import { DashboardApi as MockDashboardApi } from './mock/DashboardApi';
import { DashboardApi as RealDashboardApi } from './v1/DashboardApi';
import { DashboardApi as DemoDashboardApi } from './demo/DashboardApi';

const dashboardApi = createApiClient({
  mock: MockDashboardApi,
  real: RealDashboardApi,
  demo: DemoDashboardApi,
});
export default dashboardApi;
