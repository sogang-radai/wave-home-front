import { USE_MOCK_API } from './config';
import { PowerApi as MockPowerApi } from './mock/PowerApi';
import { PowerApi as RealPowerApi } from './v1/PowerApi';

const PowerApiImpl = USE_MOCK_API ? MockPowerApi : RealPowerApi;

const powerApi = new PowerApiImpl();
export default powerApi;
