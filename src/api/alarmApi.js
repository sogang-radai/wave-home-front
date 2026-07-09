import { createApiClient } from '../lib/apiRouter';
import { AlarmApi as MockAlarmApi } from './mock/AlarmApi';
import { AlarmApi as RealAlarmApi } from './v1/AlarmApi';
import { AlarmApi as DemoAlarmApi } from './demo/AlarmApi';

const alarmApi = createApiClient({
  mock: MockAlarmApi,
  real: RealAlarmApi,
  demo: DemoAlarmApi,
});
export default alarmApi;
