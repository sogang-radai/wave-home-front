import { PostureApi as MockPostureApi } from '../mock/PostureApi';
import { withDemoWriteGuard } from './guardedApi';

export const PostureApi = withDemoWriteGuard(MockPostureApi, [
  'updateInsight',
]);
