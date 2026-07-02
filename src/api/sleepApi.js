import { USE_MOCK_API } from './config';
import { SleepApi as MockSleepApi } from './mock/SleepApi';
import { SleepApi as RealSleepApi } from './v1/SleepApi';

const SleepApiImpl = USE_MOCK_API ? MockSleepApi : RealSleepApi;

const sleepApi = new SleepApiImpl();
export default sleepApi;
