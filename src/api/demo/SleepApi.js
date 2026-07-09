import { SleepApi as MockSleepApi } from '../mock/SleepApi';
import { withDemoWriteGuard } from './guardedApi';

export const SleepApi = withDemoWriteGuard(MockSleepApi, [
  'updateInsight',
  'applyInsight',
]);
