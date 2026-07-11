import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';

export function SleepPlanCard({ plan }) {
  if (!plan) return null;

  return (
    <Card title="오늘 밤 추천 수면 시간">
      <div className="sleep-plan-metrics">
        <Metric label="입면 시각" value={plan.bedtime} detail={`준비 ${plan.prepTime}부터`} />
        <Metric label="기상 시각" value={plan.wakeTime} />
        <Metric label="조명 dim" value={plan.lightDimTime} />
        <Metric label="권장 온도" value={`${plan.recommendedTemperatureCelsius}°C`} />
      </div>
      {plan.rationale && <p className="sleep-plan-rationale">{plan.rationale}</p>}
    </Card>
  );
}
