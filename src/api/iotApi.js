import { USE_MOCK_API } from './config';
import { IotApi as MockIotApi } from './mock/IotApi';
import { IotApi as RealIotApi } from './v1/IotApi';

const IotApiImpl = USE_MOCK_API ? MockIotApi : RealIotApi;

const iotApi = new IotApiImpl();
export default iotApi;
