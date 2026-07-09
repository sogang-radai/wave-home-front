import { httpClient } from './httpClient';
import { InsightsApi } from './InsightsApi';

const insightsApi = new InsightsApi();

// 전력 관리 페이지·대시보드 전력 카드용 API.
// 집계·리포트는 docs/db-schema.md 의 power_energy / power_report 를 따른다.
export class PowerApi {
  /** 스마트 플러그 목록 + 합산('all') 소스 */
  async getPlugs() {
    return httpClient.get('/power/plugs');
  }

  /**
   * 단기 실시간/콤보 차트 (1분·10분·30분·1시간)
   * @param {{ deviceId: string, range: 'min1'|'min10'|'min30'|'hour', metric?: 'w'|'v'|'a'|'wh' }} params
   */
  async getComboTrend({ deviceId, range, metric = 'w' }) {
    return httpClient.get('/power/trend/combo', { deviceId, range, metric });
  }

  /**
   * 일·주·월·연 기간 차트
   * @param {{ deviceId: string, period: 'day'|'week'|'month'|'year', metric?: 'w'|'wh' }} params
   */
  async getPeriodTrend({ deviceId, period, refDate }) {
    return httpClient.get('/power/trend/period', { deviceId, period, refDate });
  }

  /**
   * AI/요약 리포트 배너
   * period: power_report.period — '1h' | '24h' | '1w' | '1mo' | '1yr'
   */
  async getReport({ deviceId, period, periodStart }) {
    return httpClient.get('/power/reports', { deviceId, period, periodStart });
  }

  /** 전력 인사이트 카드 (`insight` 테이블, `surface='power'`) */
  async getInsights() {
    return insightsApi.listForSurface('power', {});
  }

  async updateInsight(insightId, { approved }) {
    return insightsApi.updateInsight(insightId, { approved });
  }
}
