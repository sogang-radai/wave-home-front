import { USE_MOCK_API } from './config';
import { HomeApi as MockHomeApi } from './mock/HomeApi';
import { HomeApi as RealHomeApi } from './v1/HomeApi';

const HomeApiImpl = USE_MOCK_API ? MockHomeApi : RealHomeApi;

const homeApi = new HomeApiImpl();
export default homeApi;
