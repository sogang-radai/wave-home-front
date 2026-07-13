import PinnedCategorySection from "../PinnedCategorySection";
import BarLanes from "../mockups/BarLanes";
import AreaChart from "../mockups/AreaChart";
import ScoreRing from "../mockups/ScoreRing";
import ListRows from "../mockups/ListRows";

const cards = [
  {
    eyebrow: "커넥티드 하이프노그램",
    title: "수면 단계를 색으로 구분한 연결형 타임라인",
    description:
      "각성, 얕은수면, 깊은수면, 렘수면을 레인별로 나눠 밤새 흐름을 한눈에 보여줍니다. 구간을 눌러 그 시각의 심박·호흡 데이터를 바로 확인하세요.",
    bullets: ["4단계 수면을 색상으로 구분", "코골이 및 뒤척임 데이터 모니터링", "취침·기상 시각 자동 인식"],
    media: <BarLanes />,
    target: "sleep",
  },
  {
    eyebrow: "바이탈 트렌드",
    title: "혈중 산소·심박·호흡을 밤새 추적",
    description:
      "비접촉 레이더 센서가 1분 단위로 바이탈을 측정해 이상 징후를 조기에 포착합니다. 특이 구간은 자동으로 하이라이트됩니다.",
    bullets: ["1분 단위 심박·호흡 측정", "혈중 산소 저하 구간 자동 표시", "야간 평균값과 최저치 비교"],
    media: (
      <div className="flex flex-col gap-4">
        <AreaChart
          label="심박수"
          value="58 bpm"
          points="0,40 30,42 60,30 90,45 120,20 150,35 180,25 210,38 240,30"
          color="#0ea5e9"
        />
        <AreaChart
          label="혈중 산소"
          value="97%"
          points="0,20 30,22 60,18 90,25 120,15 150,20 180,30 210,22 240,18"
          color="#4fb3e6"
        />
      </div>
    ),
    target: "sleep",
  },
  {
    eyebrow: "AI 수면 리포트",
    title: "점수만 보여주지 않고, 원인까지 설명하는 리포트",
    description:
      "수면 점수를 구성하는 요인(입면 시간, 각성 횟수, 깊은수면 비율 등)을 분해해 보여주고, 매일 아침·매주 요약을 자동 생성합니다.",
    bullets: ["점수를 구성하는 요인별 분해", "일간·주간 리포트 자동 생성", "전일 대비 변화 원인 설명", "수면 데이터에 따른 맞춤형 권장 액션 제공"],
    media: <ScoreRing score={86} caption="어젯밤 수면 점수" />,
    target: "sleep",
  },
  {
      eyebrow: "수면 인사이트",
      title: "잠드는 순간에 맞춰 집을 조절",
      description:
        "입면이 감지되면 에어컨 온도를 낮추고 조명을 서서히 끄며, 설정한 시각에 알람 대신 조명으로 부드럽게 깨웁니다.",
      bullets: ["입면 감지 시 에어컨·조명 자동 조절", "빛 알람으로 자연스러운 기상", "가구원별 자동화 규칙 분리"],
      media: (
        <ListRows
          rows={[
            { label: "취침 시 에어컨 24°C", meta: "켜짐", tone: "wave" },
            { label: "취침 시 조명 서서히 소등", meta: "켜짐", tone: "wave" },
            { label: "기상 시 빛 알람 07:00", meta: "설정됨", tone: "mist" },
          ]}
        />
      ),
      target: "sleep",
    }
];

export default function SleepSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="sleep"
      index={3}
      eyebrow="수면 관리"
      title="레이더로 측정되는            수면 분석"
      description="기기 착용 없이도 수면 단계, 호흡, 혈중 산소를 감지하고 매일 아침 원인까지 짚어주는 AI 리포트를 받아보세요."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
