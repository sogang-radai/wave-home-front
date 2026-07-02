import { USE_MOCK_API } from './config';
import { DashboardApi as MockDashboardApi } from './mock/DashboardApi';
import { DashboardApi as RealDashboardApi } from './v1/DashboardApi';

const DashboardApiImpl = USE_MOCK_API ? MockDashboardApi : RealDashboardApi;

const dashboardApi = new DashboardApiImpl();
export default dashboardApi;
