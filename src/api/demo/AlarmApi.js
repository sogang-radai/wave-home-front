import { AlarmApi as RealAlarmApi } from '../v1/AlarmApi';

// The demo server stores writes in the isolated runtime session and merges them
// with read-only seeded alarm data. No persistent DB rows are modified.
export class AlarmApi extends RealAlarmApi {}
