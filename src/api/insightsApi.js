import { createApiClient } from '../lib/apiRouter';
import { InsightsApi as MockInsightsApi } from './mock/InsightsApi';
import { InsightsApi as RealInsightsApi } from './v1/InsightsApi';
import { InsightsApi as DemoInsightsApi } from './demo/InsightsApi';

const insightsApi = createApiClient({
  mock: MockInsightsApi,
  real: RealInsightsApi,
  demo: DemoInsightsApi,
});
export default insightsApi;
