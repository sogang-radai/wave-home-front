import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { InsightCard } from '../../components/report/InsightCard';
import { SleepDailyReport } from './SleepDailyReport';
import { SleepWeeklyReport } from './SleepWeeklyReport';
import sleepApi from '../../api/sleepApi';
import './sleep.css';

export function SleepPage() {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  useEffect(() => {
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
    </div>
  );
}
