import { useEffect, useState } from 'react';
import sleepApi from '../../api/sleepApi';

function toNightDateParam(uiDate) {
  const start = new Date(uiDate);
  start.setDate(start.getDate() - 1);
  const year = start.getFullYear();
  const month = `${start.getMonth() + 1}`.padStart(2, '0');
  const day = `${start.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

// 숫자만 보여주면 좋은지 나쁜지 판단이 안 되니, 성인 기준 참고 범위와 비교해
// "정상 범위/낮음/높음" 같은 판정 문구를 같이 보여준다 — 의학적 기준이 아니라
// 일반적으로 통용되는 참고치.
const BREATH_NORMAL_RANGE = [12, 20]; // 회/분
const HEART_SLEEP_NORMAL_RANGE = [40, 70]; // bpm, 수면 중 심박수는 각성 시보다 낮게 나오는 게 정상

function rangeLabel(value, [min, max], normalText) {
  if (value < min) return '낮음';
  if (value > max) return '높음';
  return normalText;
}

/**
 * 호흡수·심박수 신호만으로 만든 간이 스크리닝. 그 밤의 평균 호흡수보다 뚜렷하게
 * 낮으면서 동시에 심박수는 평균 이상인 구간을 "의심 구간"으로 잡는다 — 단순히
 * 호흡이 느려지는 깊은 수면(보통 심박도 같이 낮아짐)과 구분하기 위해 두 신호를
 * 함께 본다. 의학적 진단이 아니라 참고용 스크리닝 지표.
 */
function detectSuspectedEvents(stageLog) {
  const points = (stageLog || []).filter((p) => p.breathRate > 0 && p.heartRate > 0);
  if (points.length < 3) return { events: [], breathAvg: 0, heartAvg: 0 };

  const breathAvg = average(points.map((p) => p.breathRate));
  const heartAvg = average(points.map((p) => p.heartRate));
  const events = points.filter((p) => p.breathRate <= breathAvg - 3 && p.heartRate >= heartAvg);
  return { events, breathAvg, heartAvg };
}

export function SleepApneaScreeningCard({ reportDate }) {
  const [stageLog, setStageLog] = useState(null);

  useEffect(() => {
    let cancelled = false;
    sleepApi.getDailyReport(toNightDateParam(reportDate))
      .then((report) => { if (!cancelled) setStageLog(report?.stageLog || []); })
      .catch(() => { if (!cancelled) setStageLog([]); });
    return () => { cancelled = true; };
  }, [reportDate]);

  if (stageLog === null) return null;

  const { events, breathAvg, heartAvg } = detectSuspectedEvents(stageLog);
  const hasSignal = stageLog.length >= 3;
  const hasEvents = events.length > 0;

  return (
    <div className="apnea-screening-card">
      <div className="apnea-screening-head">
        <h4 className="apnea-screening-title">수면 중 무호흡 신호 확인</h4>
      </div>

      {!hasSignal && (
        <p className="apnea-screening-summary">이 날은 확인할 호흡·심박 데이터가 충분하지 않아요.</p>
      )}

      {hasSignal && (
        <>
          {hasEvents ? (
            <>
              <p className="apnea-screening-summary">
                지난 밤 호흡·심박 신호에서 무호흡이 의심되는 구간이 <strong>{events.length}회</strong> 발견됐어요.
              </p>
              <div className="apnea-screening-chips">
                {events.map((e, i) => (
                  <span key={`${e.time}-${i}`} className="apnea-screening-chip">{e.time}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="apnea-screening-summary apnea-screening-summary--ok">
              무호흡이 의심되는 신호는 발견되지 않았어요.
            </p>
          )}
          <p className="apnea-screening-stats">
            평균 호흡수 {breathAvg.toFixed(0)}회/분 ({rangeLabel(breathAvg, BREATH_NORMAL_RANGE, '정상 범위')})
            <br />
            평균 심박수 {heartAvg.toFixed(0)}bpm ({rangeLabel(heartAvg, HEART_SLEEP_NORMAL_RANGE, '수면 중 정상 범위')})
          </p>
        </>
      )}

      <p className="apnea-screening-disclaimer">
        본 결과는 호흡과 심박 데이터를 바탕으로 분석한 참고 정보입니다. 의학적 진단을 대신하지 않으며, 코골이·주간 졸림이 반복된다면 전문의와 상담해 보세요.
      </p>
    </div>
  );
}
