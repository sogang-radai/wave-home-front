import { useEffect, useState } from 'react';
import { CareReport } from '../../components/report/CareReport';
import { PostureScoreChart } from '../../components/report/PostureScoreChart';
import postureApi from '../../api/postureApi';

function toAnalysisTuples(analysis) {
  return analysis.map((item) => [item.label, item.value, item.description]);
}

export function PostureDailyReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    postureApi.getDailyReport().then(setReport);
  }, []);

  if (!report) return null;

  return (
    <CareReport
      type="daily"
      title="어제의 자세 리포트"
      score={`${report.score}점`}
      summary={report.summary}
      visual={<PostureScoreChart data={report.log} xKey="time" valueKey="score" />}
      visualAction={null}
      analysis={toAnalysisTuples(report.analysis)}
    />
  );
}
