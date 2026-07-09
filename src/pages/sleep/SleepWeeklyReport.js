import { useMemo } from 'react';
import { CareReport } from '../../components/report/CareReport';
import { buildWeeklyAnalysis } from './sleepWeeklyUtils';

export function SleepWeeklyReport({ weeklyReport, sleepGoalHours = 7.5 }) {
  const metrics = useMemo(() => {
    if (!weeklyReport?.trend?.length) return null;
    return buildWeeklyAnalysis(weeklyReport.trend, sleepGoalHours);
  }, [weeklyReport, sleepGoalHours]);

  if (!weeklyReport || !metrics) return null;

  const summary = weeklyReport.summary?.trim() || '';

  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score={`${metrics.averageScore}점`}
      summary={summary}
      showSummary={Boolean(summary)}
      trendData={weeklyReport.trend}
      trendGoal={sleepGoalHours}
      trendSummaryAvgHours={metrics.avgHoursForSummary}
      averageScore={`${metrics.averageScore}점`}
      analysis={metrics.analysis}
      showMetricDetail
    />
  );
}
