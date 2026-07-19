import { useCallback, useEffect, useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import { AlarmPage } from '../alarm/AlarmPage';
import sleepApi from '../../api/sleepApi';
import settingsApi from '../../api/settingsApi';
import { getRollingWeekStart, getToday } from '../../lib/demoClock';
import '../../components/report/report.css';
import './sleep.css';

export function SleepPage({ tab = 'analysis', setTab }) {
  // DateNavigatorBar lives (with all its transition state) inside
  // SleepStatusReport — portal it into this slot so it renders next to the
  // tabs instead of moving its logic up here.
  const [dateNavSlot, setDateNavSlot] = useState(null);
  const [reportDate, setReportDate] = useState(getToday);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [sleepGoalHours, setSleepGoalHours] = useState(7.5);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  const handleReportDateChange = useCallback((nextDate) => {
    setReportDate(nextDate);
  }, []);

  useEffect(() => {
    const weekStart = getRollingWeekStart(reportDate);
    sleepApi.getWeeklyReport(weekStart).then(setWeeklyReport);
  }, [reportDate]);

  useEffect(() => {
    settingsApi.getSleepConfig()
      .then((config) => setSleepGoalHours(config.goalHours ?? 7.5))
      .catch(() => setSleepGoalHours(7.5));
  }, []);

  // 최신 발행일 코호트만 (과거 날짜·에이전트 배치가 누적돼도 카드가 무한히 늘지 않음).
  useEffect(() => {
    sleepApi.getInsights({ period: 'daily' }).then(setDailyInsights);
    sleepApi.getInsights({ period: 'weekly' }).then(setWeeklyInsights);
  }, [reportDate]);

  const toggleInsight = async (id) => {
    const current = [...dailyInsights, ...weeklyInsights].find((item) => item.id === id);
    if (!current) return;
    const nextApproved = !current.approved;
    const result = await sleepApi.updateInsight(id, { approved: nextApproved });
    if (result === null) return;
    setDailyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
    setWeeklyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
  };

  const allInsights = [...dailyInsights, ...weeklyInsights];

  return (
    <div className="page-stack sleep-page">
      <div className="sleep-tabs-row">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            ['analysis', '수면 분석'],
            ['alarm', '스마트 알람'],
          ]}
        />
        <div ref={setDateNavSlot} className="sleep-tabs-date-slot" />
      </div>

      {tab === 'analysis' && (
        <>
          <SleepDailyReport onReportDateChange={handleReportDateChange} dateNavTarget={dateNavSlot} />
          <SleepWeeklyReport weeklyReport={weeklyReport} sleepGoalHours={sleepGoalHours} />
          {allInsights.length > 0 && (
            <div className="insight-section">
              <h3 className="insight-section-title">수면 인사이트</h3>
              <div className="insight-list">
                {allInsights.map((item) => (
                  <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} kind={item.kind} title={item.title} text={item.text} onToggle={toggleInsight} plainFooter />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'alarm' && <AlarmPage />}
    </div>
  );
}
