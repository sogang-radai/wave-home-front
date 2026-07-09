import { useEffect, useState } from 'react';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import sleepApi from '../../api/sleepApi';
import '../../components/report/report.css';
import './sleep.css';

export function SleepPage() {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  useEffect(() => {
    // Fetched once here (not inside SleepWeeklyReport) and passed down as a
    // prop — previously SleepPage and SleepWeeklyReport each called
    // getWeeklyReport() independently, doubling the request for no reason.
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

  const allInsights = [...dailyInsights, ...weeklyInsights];

  return (
    <div className="page-stack sleep-page">
      <SleepDailyReport weeklyReport={weeklyReport} />
      <SleepWeeklyReport weeklyReport={weeklyReport} />
      {allInsights.length > 0 && (
        <div className="insight-section">
          <h3 className="insight-section-title">수면 인사이트</h3>
          <div className="insight-list">
            {allInsights.map((item) => (
              <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} title={item.title} text={item.text} onToggle={toggleInsight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
