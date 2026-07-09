import { AlarmApi as MockAlarmApi } from '../mock/AlarmApi';
import { withDemoWriteGuard } from './guardedApi';

export const AlarmApi = withDemoWriteGuard(MockAlarmApi, [
  'createAlarm',
  'updateAlarm',
  'deleteAlarm',
]);
