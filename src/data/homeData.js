export const gestureHistory = [
  { id: 1, gesture: '손 올리기', device: '거실 조명', action: '전원 켜기', time: '방금 전', confidence: 96, radar: '방 1' },
  { id: 2, gesture: '오른쪽 스와이프', device: '침실 에어컨', action: '온도 1℃ 낮춤', time: '8분 전', confidence: 91, radar: '방 2' },
  { id: 3, gesture: '주먹 쥐기', device: '서재 스피커', action: '일시정지', time: '23분 전', confidence: 88, radar: '방 2' },
  { id: 4, gesture: '왼쪽 스와이프', device: '거실 커튼', action: '닫기', time: '오늘 09:12', confidence: 94, radar: '방 1' },
];

export const gestureSets = [
  {
    id: 'daily',
    name: 'Daily Control',
    description: '조명, 커튼, 스피커처럼 자주 쓰는 가전을 빠르게 제어합니다.',
    gestures: [
      { id: 1, name: '손 올리기', action: '조명 켜기', radars: ['room1'] },
      { id: 2, name: '손 내리기', action: '조명 끄기', radars: ['room1'] },
      { id: 3, name: '왼쪽 스와이프', action: '커튼 닫기', radars: [] },
      { id: 4, name: '오른쪽 스와이프', action: '커튼 열기', radars: [] },
      { id: 5, name: '주먹 쥐기', action: '미디어 일시정지', radars: ['room2'] },
    ],
  },
  {
    id: 'sleep',
    name: '수면 모드',
    description: '취침 전 조명, 온도, 소리를 한 번에 낮추는 루틴 세트입니다.',
    gestures: [
      { id: 6, name: '손바닥 보이기', action: '수면 모드 시작', radars: ['room1'] },
      { id: 7, name: '원 그리기', action: '무드등 20%', radars: [] },
      { id: 8, name: '두 번 탭', action: '백색소음 재생', radars: [] },
      { id: 9, name: '아래 스와이프', action: '에어컨 24℃', radars: [] },
    ],
  },
  {
    id: 'focus',
    name: '집중 모드',
    description: '책상 앞에서 방해 요소를 줄이고 조명과 소리를 집중 환경으로 맞춥니다.',
    gestures: [
      { id: 10, name: '두 손 모으기', action: '집중 조명 켜기', radars: ['study'] },
      { id: 11, name: '앞으로 밀기', action: '스피커 볼륨 낮춤', radars: [] },
      { id: 12, name: '손바닥 가리기', action: '알림 음소거', radars: [] },
      { id: 13, name: '위로 스와이프', action: '공기청정기 강풍', radars: [] },
    ],
  },
  {
    id: 'rest',
    name: '휴식 모드',
    description: '휴식 시간에 맞춰 조명은 부드럽게, 음악과 온도는 편안하게 조절합니다.',
    gestures: [
      { id: 14, name: '손 흔들기', action: '휴식 음악 재생', radars: [] },
      { id: 15, name: '손바닥 위로', action: '무드등 밝게', radars: [] },
      { id: 16, name: '손바닥 아래로', action: '무드등 낮춤', radars: [] },
      { id: 17, name: '원 크게 그리기', action: '커튼 반쯤 열기', radars: [] },
    ],
  },
];

export const iotDevices = [
  {
    id: 'light',
    name: '거실 조명',
    room: '거실',
    state: '켜짐 · 밝기 72%',
    connection: 'online',
    controls: [
      { label: '전원', binding: '손 올리기 / 손 내리기' },
      { label: '밝기 조절', binding: '위아래 스와이프' },
      { label: '무드등', binding: '원 그리기' },
    ],
  },
  {
    id: 'ac',
    name: '침실 에어컨',
    room: '침실',
    state: '24℃ · 자동',
    connection: 'online',
    controls: [
      { label: '전원', binding: '손바닥 보이기' },
      { label: '온도 낮춤', binding: '오른쪽 스와이프' },
      { label: '수면풍', binding: '아래 스와이프' },
    ],
  },
  {
    id: 'speaker',
    name: '서재 스피커',
    room: '서재',
    state: '대기 중',
    connection: 'idle',
    controls: [
      { label: '재생/정지', binding: '주먹 쥐기' },
      { label: '다음 트랙', binding: '오른쪽 스와이프' },
      { label: '볼륨 낮춤', binding: '손 내리기' },
    ],
  },
];
