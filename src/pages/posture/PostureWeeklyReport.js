import { useEffect, useState } from 'react';
import { CareReport } from '../../components/report/CareReport';
import { postureScoreColor } from '../../components/report/PostureScoreChart';
import postureApi from '../../api/postureApi';

function toAnalysisTuples(analysis) {
  return analysis.map((item) => [item.label, item.value, item.description]);
}

export function PostureWeeklyReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    postureApi.getWeeklyReport().then(setReport);
  }, []);

  if (!report) return null;

  return (
    <CareReport
      type="weekly"
      title="지난 한 주 자세 리포트"
      score={`${report.score}점`}
      summary={report.summary}
      trendData={report.trend}
      trendValueKey="score"
      trendUnit="점"
      trendDomain={[0, 100]}
      trendColorFn={postureScoreColor}
      trendTooltipLabel="자세 점수"
      showTrendSummary={false}
      averageScore={`${report.averageScore}점`}
      analysis={toAnalysisTuples(report.analysis)}
    />
  );
}
