import PinnedCategorySection, {
  CategoryCard,
} from "@/components/PinnedCategorySection";
import ChatBubbles from "@/components/mockups/ChatBubbles";
import ListRows from "@/components/mockups/ListRows";

const cards: CategoryCard[] = [
  {
    eyebrow: "인사이트 챗",
    title: "오늘 데이터를 바로 물어보는 사이드 패널",
    description:
      "화면 어디서든 열 수 있는 채팅 패널에서 오늘의 수면·심박·라이프스타일 데이터에 대해 자연어로 질문하고 즉시 답을 받으세요.",
    bullets: ["오늘 데이터 기반 즉답", "화면 어디서든 열리는 패널", "질문에서 바로 자동화 제안"],
    media: <ChatBubbles />,
  },
  {
    eyebrow: "권장 액션",
    title: "리포트의 제안을 승인 한 번으로 실행",
    description:
      "리포트 카드나 주간 플랜, 어디에서 승인하든 같은 상태로 동기화됩니다. 실행할 액션만 골라 바로 적용하세요.",
    bullets: ["리포트·주간 플랜 어디서든 동일 상태 유지", "승인/보류 두 단계로 단순화", "승인 즉시 자동화에 반영"],
    media: (
      <ListRows
        rows={[
          { label: "취침 30분 앞당기기", meta: "승인 대기", tone: "amber" },
          { label: "에어컨 자동화 연장", meta: "승인됨", tone: "wave" },
          { label: "낮 스트레칭 알림 추가", meta: "승인 대기", tone: "amber" },
        ]}
      />
    ),
  },
];

export default function WaveAISection() {
  return (
    <PinnedCategorySection
      id="waveai"
      index={1}
      eyebrow="AI Agent"
      title="멀티 에이전트 WaveAI"
      description="사이드 패널에서 오늘의 수면·심박·라이프스타일 데이터를 바로 물어보고, 권장 액션을 승인만 하면 실행까지 이어집니다."
      cards={cards}
    />
  );
}
