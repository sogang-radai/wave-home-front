import { CareReport } from '../../components/report/CareReport';
import { sleepWeeklyTrendData } from '../../data/sleepData';

export function SleepWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 수면 리포트"
      score="81점"
      summary="평균 수면 시간은 줄었지만, 기상 규칙성과 깊은 수면 비율은 후반으로 갈수록 개선되었습니다."
      trendData={sleepWeeklyTrendData}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→89점', '주 후반 회복세'],
        ['총합 수면 시간', '46.8h', '전주 대비 18% 감소'],
        ['수면 부채', '2h 10m', '평일 누적 부족'],
        ['온도 민감 구간', '3회', '26℃ 이상에서 뒤척임 증가'],
        ['기상 규칙성', '82%', '전주 대비 +6%'],
      ]}
    />
  );
}
