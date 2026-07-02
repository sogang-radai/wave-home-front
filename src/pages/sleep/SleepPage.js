import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { InfoList } from '../../components/ui/InfoList';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import sleepApi from '../../api/sleepApi';
import './sleep.css';

function getSleepDuration(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export function SleepPage({ tab, setTab, onGoToSleepSettings }) {
  const [plan, setPlan] = useState(null);
  const [phoneUsage, setPhoneUsage] = useState(null);
  const [automationSummary, setAutomationSummary] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  useEffect(() => {
    sleepApi.getTodayPlan().then(setPlan);
    sleepApi.getTodayPhoneUsage().then(setPhoneUsage);
    sleepApi.getTodayAutomationSummary().then(setAutomationSummary);
    sleepApi.getWeeklyReport().then(setWeeklyReport);
    sleepApi.getInsights({ period: 'daily' }).then(setDailyInsights);
    sleepApi.getInsights({ period: 'weekly' }).then(setWeeklyInsights);
  }, []);

  const toggleInsight = async (id) => {
    const current = [...dailyInsights, ...weeklyInsights].find((item) => item.id === id);
    if (!current) return;
    const nextApproved = !current.approved;
    setDailyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
    setWeeklyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
    await sleepApi.updateInsight(id, { approved: nextApproved });
  };

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
          {plan && (
            <Card title="오늘 밤 추천 수면 시간">
              <div className="sleep-plan">
                <strong>{plan.bedtime} → {plan.wakeTime}</strong>
                <span>목표 수면 {getSleepDuration(plan.bedtime, plan.wakeTime)}</span>
                <div className="sleep-plan-row">
                  <p>취침 준비</p>
                  <b>{plan.prepTime}</b>
                </div>
                <div className="sleep-plan-row">
                  <p>조명 낮춤</p>
                  <b>{plan.lightDimTime}</b>
                </div>
                <div className="sleep-plan-row">
                  <p>권장 실내 온도</p>
                  <b>{plan.recommendedTemperatureCelsius}℃</b>
                </div>
              </div>
              <button type="button" className="sleep-plan-settings-btn" onClick={onGoToSleepSettings}>
                수면 설정 바로가기
              </button>
            </Card>
          )}

          {phoneUsage && (
            <Card title="야간 스마트폰 사용 관리">
              <div className="phone-care">
                <div>
                  <strong>{phoneUsage.usedMinutes}분</strong>
                  <span>어젯밤 취침 전 사용</span>
                </div>
                <InfoList
                  items={[
                    ['차단 시작', '23:00 이후 알림 최소화'],
                    ['권장 액션', '취침 40분 전 충전 스테이션에 두기'],
                    ['오늘 목표', `취침 전 사용 ${phoneUsage.goalMinutes}분 이하`],
                  ]}
                />
              </div>
            </Card>
          )}

          {automationSummary.map((item) => (
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
            {weeklyReport && (
              <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--sub)', marginBottom: 16 }}>
                {weeklyReport.summary}
              </p>
            )}
            <div className="insight-list">
              {[...dailyInsights, ...weeklyInsights].map((item) => (
                <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} title={item.title} text={item.text} onToggle={toggleInsight} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
