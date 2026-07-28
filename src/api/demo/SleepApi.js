import { SleepApi as MockSleepApi } from '../mock/SleepApi';
import { SleepApi as RealSleepApi } from '../v1/SleepApi';

const realSleepApi = new RealSleepApi();

export class SleepApi extends MockSleepApi {
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

  // 인사이트 승인/적용은 다른 데모 방문자와 공유되는 상태를 바꾸지 않는(사용자별
  // approved 플래그, 또는 본인 세션 내 schedule_task/automation_rule 생성) 작업이라
  // 실제 백엔드로 그대로 보낸다 - 예전엔 클라이언트 메모리에만 시뮬레이션해서
  // "실행"을 눌러도 규칙 설정·루틴 플래너에 전혀 반영되지 않았다.
  updateInsight(insightId, payload) {
    return realSleepApi.updateInsight(insightId, payload);
  }

  applyInsight(insightId) {
    return realSleepApi.applyInsight(insightId);
  }
}
