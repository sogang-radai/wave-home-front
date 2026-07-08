import { USE_MOCK_API } from './config';
import { AlarmApi as MockAlarmApi } from './mock/AlarmApi';
import { AlarmApi as RealAlarmApi } from './v1/AlarmApi';

const AlarmApiImpl = USE_MOCK_API ? MockAlarmApi : RealAlarmApi;

const alarmApi = new AlarmApiImpl();
export default alarmApi;
