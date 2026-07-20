import PinnedCategorySection from "../PinnedCategorySection";
import AreaChart from "../mockups/AreaChart";
import ListRows from "../mockups/ListRows";
import electricity from "../electricity.png";
import importanceOfElectricity from "../importance_of_electricity.png";

const cards = [
  {
    eyebrow: "실시간 사용량",
    title: "기기별 전력 사용량을 한눈에 확인",
    description:
      "방과 기기별 전력 사용량을 실시간으로 추적하고, 오늘 예상 전기요금까지 바로 계산해 보여드립니다.",
    bullets: ["실시간 전력 사용량 추적", "실시간 전기요금 계산"],
    media: (
      <AreaChart
        label="오늘 전력 사용량"
        value="4.2 kWh"
        points="0,45 30,40 60,42 90,25 120,30 150,15 180,20 210,10 240,18"
        color="#22c55e"
      />
    ),
    target: "power",
  },
  {
    eyebrow: "리포트",
    title: "주간 전력 리포트로 사용 패턴을 한눈에",
    description:
      "매주 방과 기기별 사용량을 정리한 리포트를 보내드리고, 전주 대비 변화와 예상 요금, 절약 팁까지 함께 안내합니다.",
    bullets: ["주간 전력 사용 리포트 자동 생성", "전주 대비 변화 요약", "절약 팁 제안"],
    media: (
      <ListRows
        rows={[
          { label: "이번 주 사용량", meta: "18.4 kWh", tone: "wave" },
          { label: "전주 대비", meta: "+22%", tone: "amber" },
          { label: "예상 요금", meta: "8,200원", tone: "wave" },
        ]}
      />
    ),
    target: "power",
  },
  {
    eyebrow: "채팅으로 제어",
    title: "채팅 한마디로 전력을 확인하고 제어",
    description:
      "\"지금 집 전체 전력 얼마나 써?\"처럼 물어보면 바로 답해드리고, 필요한 기기는 채팅으로 바로 끄거나 예약할 수 있어요.",
    bullets: ["채팅을 통한 실시간 전력 조회", "채팅으로 즉시 기기 제어"],
    media: (
      <img
        src={electricity}
        alt="채팅 한마디로 전력을 확인하고 제어"
        className="aspect-[1223/1286] w-full rounded-xl object-contain"
      />
    ),
    target: { page: "main", chatMode: "popup" },
  },
  {
      bleed: true,
      title: "전력관리의 중요성",
      wide: true,
      media: (
        <img
          src={importanceOfElectricity}
          alt="전력관리의 중요성"
          className="aspect-[1624/969]  w-full object-cover"
        />
      ),
    },
];

export default function PowerSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="power"
      index={4}
      accent={{ text: "#1f9d5c", from: "#edf8f3", to: "#c8e9d9" }}
      eyebrow="전력 관리"
      title="전기요금까지 계산해주는 전력 관리"
      description="방과 기기별 전력 사용량을 실시간으로 추적하고, 주간 리포트로 사용 패턴을 짚어주며, 채팅 한마디로 바로 제어할 수 있어요."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
