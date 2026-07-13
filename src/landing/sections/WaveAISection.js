import PinnedCategorySection from "../PinnedCategorySection";
import ChatBubbles from "../mockups/ChatBubbles";
import ListRows from "../mockups/ListRows";

const cards = [
  {
    eyebrow: "인사이트 챗",
    title: "오늘 데이터를 바로 물어보는 팝업창",
    description:
      "화면 어디서든 열 수 있는 채팅 패널에서 오늘의 수면·심박·라이프스타일 데이터에 대해 자연어로 질문하고 즉시 답을 받으세요.",
    bullets: ["오늘 데이터 기반 즉답", "화면 어디서든 열리는 패널", "질문에서 바로 자동화 제안"],
    media: <ChatBubbles />,
    target: { page: "main", chatMode: "popup" },
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
    target: "weeklyPlan",
  },
  {
    eyebrow: "기기 제어",
    title: "채팅 한 줄로 실행하는 가전 제어·자동화",
    description:
      "말이나 텍스트로 조명, 에어컨 같은 가전을 바로 제어하세요. 자주 쓰는 명령은 자동화 루틴으로 저장해 한 문장으로 실행할 수 있어요.",
    bullets: [
      "자연어 명령으로 가전 즉시 제어",
      "반복되는 명령을 자동화 루틴으로 저장",
      "여러 기기를 한 번에 묶어서 실행",
    ],
    media: (
      <ListRows
        rows={[
          { label: '"거실 조명 꺼줘"', meta: "실행됨", tone: "wave" },
          { label: '"에어컨 24도로 맞춰줘"', meta: "실행됨", tone: "wave" },
          { label: '"외출 모드 켜줘"', meta: "실행됨", tone: "wave" },
        ]}
      />
    ),
    target: { page: "chat" }
  },
];

export default function WaveAISection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="waveai"
      index={2}
      eyebrow="WaveAI"
      title="멀티 에이전트 WaveAI"
      description="팝업창에서 오늘의 수면·심박·라이프스타일 데이터를 바로 물어보고, 권장 액션을 승인만 하면 실행까지 이어집니다."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
