export const insightSuggestions = [
  '오늘 수면 인사이트 알려줘',
  '자세 점수가 왜 낮아졌어?',
  '오늘 심박수 어때?',
];

export const CHAT_SUGGESTION_POOL = [
  { icon: '🌙', label: '수면 분석', prompt: '어젯밤 수면 점수를 분석해줘' },
  { icon: '🧘', label: '자세 교정', prompt: '거북목 개선 스트레칭 루틴 추천해줘' },
  { icon: '❤️', label: '심박 트렌드', prompt: '오늘 심박수가 평소와 다른 이유가 뭐야?' },
  { icon: '🏠', label: '가전 자동화', prompt: '취침 전 가전 자동화 설정 도와줘' },
  { icon: '📋', label: '헬스 루틴', prompt: '이번 주 건강 목표를 세워줘' },
  { icon: '💤', label: '수면 환경', prompt: '더 깊은 수면을 위한 실내 환경 알려줘' },
  { icon: '🌡️', label: '최적 온도', prompt: '수면에 최적인 실내 온도가 몇 도야?' },
  { icon: '⚡', label: '에너지 향상', prompt: '에너지 점수를 높이는 방법 알려줘' },
];

export const initialChatConversations = [
  {
    id: 1,
    title: '수면 분석 질문',
    messages: [
      { role: 'assistant', text: '안녕하세요! 수면에 대해 궁금한 점이 있으신가요?' },
      { role: 'user', text: '어젯밤 수면 점수가 낮은 이유가 뭔가요?' },
      { role: 'assistant', text: '어젯밤 수면 점수가 낮은 주요 원인은 뒤척임이 많았던 03:05~03:40 구간이에요. 그 시간대 실내 온도가 26℃를 넘으면서 수면 질이 떨어졌어요. 에어컨 예약을 새벽 4시까지 1시간 연장해보시는 걸 추천드려요!' },
    ],
  },
  {
    id: 2,
    title: '자세 교정 루틴',
    messages: [
      { role: 'assistant', text: '자세 교정 루틴에 대해 알아볼까요?' },
      { role: 'user', text: '거북목 교정 스트레칭 알려줘' },
      { role: 'assistant', text: '거북목 교정에 좋은 스트레칭을 알려드릴게요!\n\n1. 턱 당기기 (Chin Tuck) — 10초 × 10회\n2. 목 옆으로 스트레칭 — 각 방향 20초\n3. 어깨 으쓱 후 내리기 — 5회 반복\n\n하루 3번, 특히 착석 50분 후에 해주세요 🧘' },
    ],
  },
  {
    id: 3,
    title: '심박수 트렌드',
    messages: [
      { role: 'assistant', text: '오늘 심박수 데이터를 분석해드릴게요.' },
    ],
  },
];

export function getInsightReply(question) {
  const q = question.toLowerCase();
  if (q.includes('수면') || q.includes('잠')) {
    return '어젯밤 수면 시간은 7.0시간으로 7일 평균(7.2시간)과 비슷했지만 일일 목표인 7.5시간에는 살짝 못 미쳤어요. 입면은 23:42, 기상은 06:42였어요.';
  }
  if (q.includes('자세') || q.includes('거북목')) {
    return '오늘 자세 점수는 68점/100으로 다소 주의가 필요해요. 거북목이 4회 감지되었지만 전주 평균 7.3회보다는 개선된 편이에요.';
  }
  if (q.includes('심박') || q.includes('맥박') || q.includes('bpm')) {
    return '오늘 심박수는 평균 69bpm이고 최저 54bpm·최고 82bpm을 기록했어요. 현재 측정값은 62bpm으로 안정적인 범위예요.';
  }
  if (q.includes('레이더') || q.includes('연결')) {
    return '방 1 레이더는 정상적으로 연결되어 있어요. 기기등록 설정에서 구역별 연결 상태를 확인할 수 있어요.';
  }
  return '아직 답변을 준비 중인 질문이에요. 수면, 자세, 심박수에 대해 물어보시면 오늘 데이터를 바탕으로 알려드릴게요!';
}
