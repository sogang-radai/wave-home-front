import PinnedCategorySection from "../PinnedCategorySection";
import StatGrid from "../mockups/StatGrid";
import ListRows from "../mockups/ListRows";

const cards = [
  {
    eyebrow: "통합 현황",
    title: "오늘 하루를 한눈에 보는 요약 화면",
    description:
      "수면 점수, 심박수, 활동량, 남은 할 일을 카드 4개로 압축했습니다. 자세히 볼 지표만 눌러 바로 상세 리포트로 이동할 수 있어요.",
    bullets: [
      "지표별 색상 태그로 상태 즉시 파악",
      "카드 클릭 시 해당 상세 리포트로 이동",
      "가장 먼저 처리할 일 하나를 상단에 고정",
    ],
    media: <StatGrid />,
  },
  {
    eyebrow: "빠른 이동",
    title: "화면을 누르면 바로 관련 메뉴로 이동",
    description:
      "대시보드의 카드를 눌러보세요. 수면 점수를 누르면 수면 리포트로, 심박수를 누르면 바이탈 트렌드로 — 메뉴를 찾아 헤매지 않고 바로 상세 화면에 도착합니다.",
    bullets: [
      "카드 클릭 시 관련 상세 화면으로 즉시 이동",
      "지표 어디를 눌러도 해당 리포트로 연결",
      "메뉴 탐색 없이 원하는 화면에 바로 도착",
    ],
    media: (
      <ListRows
        rows={[
          { label: "수면 점수 카드", meta: "수면 리포트로 이동", tone: "wave" },
          { label: "심박수 카드", meta: "바이탈 트렌드로 이동", tone: "wave" },
          { label: "오늘 할 일 카드", meta: "할 일 목록으로 이동", tone: "wave" },
        ]}
      />
    ),
  },
];

export default function DashboardSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="dashboard"
      index={5}
      eyebrow="대시보드"
      title="집안의 모든 건강 신호를 한 화면에"
      description="수면, 심박, 활동량, 오늘의 할 일까지, 흩어져 있던 지표를 하나의 화면으로 통합했습니다."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
