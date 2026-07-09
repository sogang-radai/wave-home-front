import { SleepApi as MockSleepApi } from '../mock/SleepApi';
import { SleepApi as RealSleepApi } from '../v1/SleepApi';
import { withDemoWriteGuard } from './guardedApi';

const realSleepApi = new RealSleepApi();
const GuardedSleepApi = withDemoWriteGuard(MockSleepApi, [
  'updateInsight',
  'applyInsight',
]);

export class SleepApi extends GuardedSleepApi {
  getTodaySummary() {
    return realSleepApi.getTodaySummary();
  }

  getTodayPlan() {
    return realSleepApi.getTodayPlan();
  }

  getTodayPhoneUsage() {
    return realSleepApi.getTodayPhoneUsage();
  }

  getTodayAutomationSummary() {
    return realSleepApi.getTodayAutomationSummary();
  }

  getDailySessions(date) {
    return realSleepApi.getDailySessions(date);
  }

  getDailyReport(date, opts) {
    return realSleepApi.getDailyReport(date, opts);
  }

  getWeeklyReport(params) {
    return realSleepApi.getWeeklyReport(params);
  }

  getInsights(params) {
    return realSleepApi.getInsights(params);
  }
}
