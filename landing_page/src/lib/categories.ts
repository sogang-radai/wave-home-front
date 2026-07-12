export type Category = {
  id: string;
  label: string;
};

export const categories: Category[] = [
  { id: "waveai", label: "AI Agent" },
  { id: "sleep", label: "수면 관리" },
  { id: "smarthome", label: "스마트홈" },
  { id: "lifestyle", label: "라이프스타일 관리" },
  { id: "dashboard", label: "대시보드" },
];
