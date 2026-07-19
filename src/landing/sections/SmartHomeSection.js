import PinnedCategorySection from "../PinnedCategorySection";
import GestureGrid from "../mockups/GestureGrid";
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
];

export default function SmartHomeSection({ onEnter }) {
  return (
    <PinnedCategorySection
      id="smarthome"
      index={5}
      accent={{ text: "#b8860b", from: "#fdf8ee", to: "#f7e9c9" }}
      eyebrow="가전 관리"
      title="손짓 하나로 움직이는 우리 집"
      description="제스처로 조명과 가전을 제어하고, 3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인하세요."
      cards={cards}
      onEnter={onEnter}
    />
  );
}
