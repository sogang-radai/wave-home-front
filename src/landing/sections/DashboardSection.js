import PinnedCategorySection from "../PinnedCategorySection";
import StatGrid from "../mockups/StatGrid";
import ListRows from "../mockups/ListRows";

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
      eyebrow="대시보드"
      title="집안의 모든 건강 신호를 한 화면에"
      description="수면, 심박, 활동량, 오늘의 할 일까지, 흩어져 있던 지표를 하나의 화면으로 통합했습니다."
      cards={cards}
      onEnter={onEnter}
      overlapPrevious
    />
  );
}
