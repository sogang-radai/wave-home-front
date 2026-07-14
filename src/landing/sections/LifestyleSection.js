import PinnedCategorySection from "../PinnedCategorySection";
import ListRows from "../mockups/ListRows";

const cards = [
  {
    eyebrow: "주간 계획",
    title: "지속가능한 스케줄을 관리해주는 목표 달성 코치",
    description:
      "목표를 등록하면 이를 지킬 수 있도록 하루 일정을 자동으로 짜드립니다. 진행 상황에 맞춰 일정을 조정해드려요.",
    bullets: [
      "기존의 일정을 고려한 새로운 일정 추천",
      "목표 달성 코칭",
    ],
    media: (
      <ListRows
        rows={[
          { label: "아침 스트레칭 10분", meta: "완료", tone: "wave" },
          { label: "저녁 산책 30분", meta: "진행 중", tone: "amber" },
          { label: "취침 전 독서 15분", meta: "예정", tone: "mist" },
        ]}
      />
    ),
    target: "weeklyPlan",
  },
  {
    eyebrow: "스마트 알람",
    title: "가구원마다 다르게 울리는 맞춤형 알람",
    description:
      "기상 시간과 수면 패턴, 일정에 맞춰 알람을 자동으로 제안하고 조명·음향과 연동해 부드럽게 깨워줍니다. 가구원별로 알람을 따로 관리할 수 있어요.",
    bullets: [
      "최적 기상 시간 제안",
      "조명·음향 연동 빛 알람",
      "가구원별 알람 개별 관리",
    ],
    media: (
      <ListRows
        rows={[
          { label: "평일 기상 알람 · 07:00", meta: "켜짐", tone: "wave" },
          { label: "주말 기상 알람 · 08:30", meta: "꺼짐", tone: "mist" },
          { label: "빛 알람 (조명 연동)", meta: "켜짐", tone: "wave" },
        ]}
      />
    ),
    target: "alarm",
  },
];

export default function LifestyleSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="lifestyle"
      index={4}
      eyebrow="라이프스타일 관리"
      title="일상의 흐름까지 함께 관리하는 라이프스타일 케어"
      description="목표 달성을 위한 일정 관리부터 가구원별 맞춤 알람까지 하루의 리듬을 자연스럽게 챙겨드립니다."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
