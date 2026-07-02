import { USE_MOCK_API } from './config';
import { PostureApi as MockPostureApi } from './mock/PostureApi';
import { PostureApi as RealPostureApi } from './v1/PostureApi';

const PostureApiImpl = USE_MOCK_API ? MockPostureApi : RealPostureApi;

const postureApi = new PostureApiImpl();
export default postureApi;
