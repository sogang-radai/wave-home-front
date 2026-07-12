import PinnedCategorySection, {
  CategoryCard,
} from "@/components/PinnedCategorySection";
import StatGrid from "@/components/mockups/StatGrid";
import ListRows from "@/components/mockups/ListRows";

const cards: CategoryCard[] = [
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
  // {
  //   eyebrow: "알림 센터",
  //   title: "놓치기 쉬운 변화까지 챙기는 알림함",
  //   description:
  //     "리포트 생성, 기기 연결 상태 같은 이벤트를 한 곳에서 확인하고, 모두 읽음 처리로 빠르게 정리하세요.",
  //   bullets: ["읽음/안읽음 구분 표시", "모두 읽음 처리 한 번에", "가구원별 알림 분리 수신"],
  //   media: (
  //     <ListRows
  //       rows={[
  //         { label: "주간 수면 리포트 도착", meta: "새 리포트", tone: "wave" },
  //         { label: "레이더 센서 연결됨", meta: "확인", tone: "mist" },
  //       ]}
  //     />
  //   ),
  // },
  // {
  //   eyebrow: "다중 계정",
  //   title: "가족 구성원 계정을 한 앱에서 전환",
  //   description:
  //     "같은 집에 사는 가족의 데이터를 계정 전환만으로 확인할 수 있어요. 침실별 레이더와 계정을 매칭해 데이터가 섞이지 않습니다.",
  //   bullets: ["가구원별 대시보드 분리", "침실-레이더 자동 매칭", "공유 투두는 실시간 동기화"],
  //   media: (
  //     <ListRows
  //       rows={[
  //         { label: "내 계정", meta: "현재 계정", tone: "wave" },
  //         { label: "배우자", meta: "전환", tone: "mist" },
  //         { label: "자녀 방", meta: "전환", tone: "mist" },
  //       ]}
  //     />
  //   ),
  // },
];

export default function DashboardSection() {
  return (
    <PinnedCategorySection
      id="dashboard"
      index={5}
      eyebrow="대시보드"
      title="집안의 모든 건강 신호를 한 화면에"
      description="수면, 심박, 활동량, 오늘의 할 일까지, 흩어져 있던 지표를 하나의 화면으로 통합했습니다."
      cards={cards}
    />
  );
}
