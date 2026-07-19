import PinnedCategorySection from "../PinnedCategorySection";
import StatGrid from "../mockups/StatGrid";
import ListRows from "../mockups/ListRows";
import goalCoaching from "../goal_coaching.png";

const cards = [
  {
    eyebrow: "통합 현황",
    title: "오늘 하루를 한눈에 보는 요약 화면",
    description:
      "어젯밤 수면, 남은 할 일, 전력 관리, 활성화된 제스처 목록, 기기 연결 현황을 한곳에 모았습니다. 자세히 볼 카드를 눌러 바로 해당 페이지로 이동할 수 있어요.",
    bullets: [
      "중요 지표로 쉽게 파악",
      "추천 수면시간 표시"
    ],
    media: <StatGrid />,
    target: "main",
  },
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
      <img
        src={goalCoaching}
        alt="목표 달성 코치"
        className="aspect-[1310/794] w-full rounded-xl object-contain"
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
    target: { page: "sleep", sleepTab: "alarm" },
  },
  {
    eyebrow: "빠른 이동",
    title: "화면을 누르면 바로 관련 메뉴로 이동",
    description:
      "대시보드의 카드를 눌러보세요. 수면 점수를 누르면 수면 리포트로, 제스처 카드를 누르면 제스처 설정 페이지로 — 메뉴를 찾아 헤매지 않고 바로 상세 화면에 도착합니다.",
    bullets: [
      "카드 클릭 시 관련 상세 화면으로 즉시 이동",
      "지표 어디를 눌러도 해당 리포트로 연결",
      "메뉴 탐색 없이 원하는 화면에 바로 도착",
    ],
    media: (
      <ListRows
        rows={[
          { label: "수면 관리 카드", meta: "수면 리포트로 이동", tone: "wave" },
          { label: "전력 관리 카드", meta: "전력 리포트로 이동", tone: "wave" },
          { label: "오늘 할 일 카드", meta: "주간 계획 페이지로 이동", tone: "wave" },
        ]}
      />
    ),
    target: "main",
  },
];

export default function DashboardSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="dashboard"
      index={1}
      accent={{ text: "#c2255c", from: "#fcf2f6", to: "#f7d6e4" }}
      eyebrow="대시보드"
      title="집안의 모든 건강 신호를 한 화면에"
      description="수면, 심박, 활동량, 오늘의 할 일까지, 흩어져 있던 지표를 하나의 화면으로 통합했습니다. 일상의 흐름까지 함께 관리하는 라이프스타일 케어 — 목표 달성을 위한 일정 관리부터 가구원별 맞춤 알람까지 하루의 리듬을 자연스럽게 챙겨드립니다."
      cards={cards}
      onEnter={onEnter}
      overlapPrevious
    />
  );
}
