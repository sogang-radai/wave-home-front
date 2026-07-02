import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { InfoList } from '../../components/ui/InfoList';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import { sleepSettingSummaries, sleepDailyInsights, sleepWeeklyInsights } from '../../data/sleepData';
import './sleep.css';

export function SleepPage({ tab, setTab, onGoToSleepSettings }) {
  return (
    <div className="page-stack">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          ['current', '오늘의 수면준비'],
          ['report', '수면 리포트'],
        ]}
      />
      {tab === 'current' && (
        <div className="dashboard-grid">
          <Card title="오늘 밤 추천 수면 시간">
            <div className="sleep-plan">
              <strong>23:30 → 06:40</strong>
              <span>목표 수면 7시간 10분</span>
              <div className="sleep-plan-row">
                <p>취침 준비</p>
                <b>22:50</b>
              </div>
              <div className="sleep-plan-row">
                <p>조명 낮춤</p>
                <b>23:00</b>
              </div>
              <div className="sleep-plan-row">
                <p>권장 실내 온도</p>
                <b>24℃</b>
              </div>
            </div>
            <button type="button" className="sleep-plan-settings-btn" onClick={onGoToSleepSettings}>
              수면 설정 바로가기
            </button>
          </Card>
          <Card title="야간 스마트폰 사용 관리">
            <div className="phone-care">
              <div>
                <strong>18분</strong>
                <span>어젯밤 취침 전 사용</span>
              </div>
              <InfoList
                items={[
                  ['차단 시작', '23:00 이후 알림 최소화'],
                  ['권장 액션', '취침 40분 전 충전 스테이션에 두기'],
                  ['오늘 목표', '취침 전 사용 10분 이하'],
                ]}
              />
            </div>
          </Card>

          {sleepSettingSummaries.map((item) => (
            <Card key={item.title} title={item.title} action="적용 중" onClick={onGoToSleepSettings}>
              <p className="report-summary-only">{item.text}</p>
            </Card>
          ))}
        </div>
      )}
      {tab === 'report' && (
        <>
          <SleepDailyReport />
          <SleepWeeklyReport />
          <Card title="WaveAI 수면 리포트">
            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--sub)', marginBottom: 16 }}>
              이번 주 평균 수면 시간은 <strong style={{ color: 'var(--ink)' }}>6.7시간</strong>으로
              목표 7.5시간보다 0.8시간 부족했어요. 어젯밤은 <strong style={{ color: 'var(--ink)' }}>6시간 25분</strong> 수면으로
              주 평균과 비슷하지만, 깊은 수면 비율이 전주 대비 <strong style={{ color: 'var(--ink)' }}>8% 높아졌어요.</strong>{' '}
              수면 중 온도가 26℃를 넘은 구간에서 뒤척임이 집중되었으니,
              오늘 밤은 에어컨 예약을 새벽 4시까지 유지해보세요.
            </p>
            <div className="insight-list">
              {[...sleepDailyInsights, ...sleepWeeklyInsights].map((item) => (
                <InsightCard key={item.id} id={item.id} label={item.label} title={item.title} text={item.text} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
