import PinnedCategorySection from "../PinnedCategorySection";
import GestureGrid from "../mockups/GestureGrid";
import AreaChart from "../mockups/AreaChart";
import ListRows from "../mockups/ListRows";
import twinHome from "../twin_home.png";

const cards = [
  {
    eyebrow: "디지털 트윈 홈",
    title: "가상의 집을 만들어 관리하세요",
    description:"현실과 연결된 가상의 집에서 다양한 상황에서의 기기를 제어해보세요.",
    bullets: ["IoT 기기 제어"],
    media: (
      <img
        src={twinHome}
        alt="가상의 집을 만들어 관리하세요"
        className="aspect-[2419/1464] w-full rounded-xl object-cover"
      />
    ),
    target: { page: "home", homeTab: "twin" },
  },
  {
    eyebrow: "가전 제어",
    title: "손짓을 기기 동작으로 매핑",
    description:
      "레이더가 인식한 제스처를 원하는 IoT 기기 동작에 자유롭게 연결합니다. 손을 흔들어 조명을 끄고, 스와이프해서 에어컨을 조절하세요.",
    bullets: ["제스처-기기 매핑 자유롭게 설정", "인식 기록으로 오탐 확인", "침실별 제스처 세트 분리"],
    media: <GestureGrid />,
    target: { page: "home", homeTab: "gesture" },
  },
  {
    eyebrow: "제스처 세트 관리",
    title: "상황별로 다른 제스처 세트 전환",
    description:
      "취침용, 기상용, 낮잠용 등 상황에 맞는 제스처 세트를 만들어두고 필요할 때 바로 전환할 수 있어요.",
    bullets: ["상황별 제스처 세트 저장", "세트 간 원터치 전환", "가구원별 세트 개별 관리"],
    media: (
      <ListRows
        rows={[
          { label: "취침 모드", meta: "사용 중", tone: "wave" },
          { label: "기상 모드", meta: "전환", tone: "mist" },
          { label: "낮잠 모드", meta: "전환", tone: "mist" },
        ]}
      />
    ),
    target: { page: "home", homeTab: "gesture" },
  },
  {
    eyebrow: "전력 관리",
    title: "기기별 전력 사용량을 한눈에 확인",
    description:
      "방과 기기별 전력 사용량을 실시간으로 추적하고, 사용량이 급증하면 알려드립니다. 대기전력이 많은 기기는 자동 절전 모드를 제안해요.",
    bullets: [
      "실시간 전력 사용량 추적",
      "실시간 전기요금 계산",
      "채팅을 통한 실시간 전력 제어"
    ],
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
];

export default function SmartHomeSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="smarthome"
      index={5}
      eyebrow="스마트홈 제어"
      title="손짓 하나로 움직이는 침실"
      description="제스처로 조명과 가전을 제어하고, 수면 데이터에 맞춰 에어컨과 조명을 자동으로 조절하세요."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
