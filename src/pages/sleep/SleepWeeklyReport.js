import { useEffect, useState } from 'react';
import { CareReport } from '../../components/report/CareReport';
import sleepApi from '../../api/sleepApi';

function toAnalysisTuples(analysis) {
  return analysis.map((item) => [item.label, item.value]);
}

export function SleepWeeklyReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    sleepApi.getWeeklyReport().then(setReport);
  }, []);

  if (!report) return null;

  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score={`${report.score}점`}
      summary={report.summary}
      trendData={report.trend}
      averageScore={`${report.averageScore}점`}
      analysis={toAnalysisTuples(report.analysis)}
      showMetricDetail={false}
    />
  );
}
