import { InsightsApi as MockInsightsApi } from '../mock/InsightsApi';
import { withDemoWriteGuard } from './guardedApi';

export const InsightsApi = withDemoWriteGuard(MockInsightsApi, [
  'updateInsight',
  'apply',
]);
