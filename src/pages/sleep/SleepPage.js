import { useCallback, useEffect, useState } from 'react';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepPlanCard } from './SleepPlanCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import sleepApi from '../../api/sleepApi';
import settingsApi from '../../api/settingsApi';
import { getRollingWeekStart, getToday } from '../../lib/demoClock';
import '../../components/report/report.css';
import './sleep.css';

export function SleepPage() {
  const [reportDate, setReportDate] = useState(getToday);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
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
    sleepApi.getInsights({ period: 'daily' }).then(setDailyInsights);
    sleepApi.getInsights({ period: 'weekly' }).then(setWeeklyInsights);
    sleepApi.getTodayPlan().then(setTodayPlan);
  }, []);

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
      <SleepPlanCard plan={todayPlan} />
      <SleepDailyReport onReportDateChange={handleReportDateChange} />
      <SleepWeeklyReport weeklyReport={weeklyReport} sleepGoalHours={sleepGoalHours} />
      {allInsights.length > 0 && (
        <div className="insight-section">
          <h3 className="insight-section-title">수면 인사이트</h3>
          <div className="insight-list">
            {allInsights.map((item) => (
              <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} title={item.title} text={item.text} onToggle={toggleInsight} plainFooter />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
