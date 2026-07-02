import { CareReport } from '../../components/report/CareReport';
import { PostureScoreChart } from '../../components/report/PostureScoreChart';
import { postureLog } from '../../data/postureData';

export function PostureDailyReport() {
  return (
    <CareReport
      type="daily"
      title="어제의 자세 리포트"
      score="82점"
      summary="오래 앉아 있을수록 허리보다 목 자세가 먼저 무너지는 패턴이 반복되었습니다."
      visual={<PostureScoreChart data={postureLog} xKey="time" valueKey="score" />}
      visualAction={null}
      analysis={[
        ['자세 점수', '82점', '어제보다 6점 상승'],
        ['책상 앞 체류 시간', '5h 20m', '오후 업무 구간 집중'],
        ['바른 자세 유지', '62%', '목표 70%까지 8%p 부족'],
        ['거북목 위험 시간', '48분', '3단계 알림 전 1회 회복'],
        ['허리 굽음 시간', '1h 10m', '골반 세우기 피드백 필요'],
        ['가장 무너진 시간대', '15:00~17:00', '목 전방 자세 반복'],
      ]}
    />
  );
}
