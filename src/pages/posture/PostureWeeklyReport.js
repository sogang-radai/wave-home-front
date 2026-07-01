import { CareReport } from '../../components/report/CareReport';
import { postureScoreColor } from '../../components/report/PostureScoreChart';
import { postureWeeklyTrendData, postureWeeklyInsights } from '../../data/postureData';

export function PostureWeeklyReport() {
  return (
    <CareReport
      type="weekly"
      title="지난 한 주 자세 리포트"
      score="81점"
      summary="자세 점수는 상승했지만 허리 굽음 빈도는 늘어, 목 리셋과 허리 리셋을 분리해서 관리해야 합니다."
      trendData={postureWeeklyTrendData}
      trendValueKey="score"
      trendUnit="점"
      trendDomain={[0, 100]}
      trendColorFn={postureScoreColor}
      trendTooltipLabel="자세 점수"
      showTrendSummary={false}
      averageScore="81점"
      analysis={[
        ['점수 변화', '74→81점', '주간 평균 기준 개선'],
        ['거북목 지속 시간', '18% 감소', '목 리셋 알림 반응 개선'],
        ['허리 굽음 빈도', '9% 증가', '오후 착석 후반부 집중'],
        ['휴식 루틴 수행률', '64%', '목표 80%까지 16%p 부족'],
        ['장시간 착석 알림', '7회', '50분 이상 같은 자세 유지'],
      ]}
      insights={postureWeeklyInsights}
    />
  );
}
