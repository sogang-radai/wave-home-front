import { getNow } from '../lib/demoClock';

export const koreanWeekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export const initialTodos = [
  // 월요일
  { id: 1,  title: '기상 후 목 스트레칭 20초',    done: false, day: '월', cat: '자세',  startMin: 7*60,       endMin: 7*60+20 },
  { id: 2,  title: '아침 샐러드',                  done: false, day: '월', cat: '식습관', startMin: 8*60,       endMin: 8*60+30 },
  { id: 3,  title: '5분 명상',                     done: false, day: '월', cat: '멘탈',  startMin: 9*60,       endMin: 9*60+5 },
  { id: 4,  title: '자정 전 취침',                 done: false, day: '월', cat: '수면',  startMin: 23*60,      endMin: 23*60+30 },
  // 화요일
  { id: 5,  title: '어깨 스트레칭 10분',           done: false, day: '화', cat: '자세',  startMin: 7*60+30,    endMin: 7*60+40 },
  { id: 6,  title: '점심 채소 위주',               done: false, day: '화', cat: '식습관', startMin: 12*60,      endMin: 12*60+30 },
  { id: 7,  title: '저널링 10분',                  done: false, day: '화', cat: '멘탈',  startMin: 20*60,      endMin: 20*60+10 },
  { id: 8,  title: '스마트폰 디톡스 1시간',        done: false, day: '화', cat: '수면',  startMin: 22*60,      endMin: 23*60 },
  // 수요일
  { id: 9,  title: '오후 4시 목 스트레칭',         done: false, day: '수', cat: '자세',  startMin: 16*60,      endMin: 16*60+5 },
  { id: 10, title: '저녁 스트레칭 10분',           done: false, day: '수', cat: '자세',  startMin: 19*60,      endMin: 19*60+10 },
  { id: 11, title: '수분 섭취 2L 체크',            done: false, day: '수', cat: '식습관', startMin: 12*60+30,   endMin: 13*60 },
  { id: 12, title: '화면 밝기 줄이기',             done: false, day: '수', cat: '수면',  startMin: 22*60,      endMin: 22*60+10 },
  { id: 13, title: '자정 전 취침',                 done: false, day: '수', cat: '수면',  startMin: 23*60,      endMin: 23*60+30 },
  // 목요일
  { id: 14, title: '기지개 스트레칭',              done: false, day: '목', cat: '자세',  startMin: 7*60,       endMin: 7*60+10 },
  { id: 15, title: '걷기 명상 20분',               done: false, day: '목', cat: '멘탈',  startMin: 15*60,      endMin: 15*60+20 },
  { id: 16, title: '저녁 가볍게 먹기',             done: false, day: '목', cat: '식습관', startMin: 18*60,      endMin: 18*60+30 },
  { id: 17, title: '음악 들으며 취침 준비',        done: false, day: '목', cat: '수면',  startMin: 22*60+30,   endMin: 23*60 },
  // 금요일
  { id: 18, title: '스쿼트 10회',                  done: false, day: '금', cat: '자세',  startMin: 7*60+30,    endMin: 7*60+40 },
  { id: 19, title: '과일 간식 챙기기',             done: false, day: '금', cat: '식습관', startMin: 15*60,      endMin: 15*60+10 },
  { id: 20, title: '독서 30분',                    done: false, day: '금', cat: '멘탈',  startMin: 20*60,      endMin: 20*60+30 },
  { id: 21, title: '22:30 전 취침',                done: false, day: '금', cat: '수면',  startMin: 22*60+30,   endMin: 23*60 },
  // 토요일
  { id: 22, title: '요가 30분',                    done: false, day: '토', cat: '자세',  startMin: 8*60,       endMin: 8*60+30 },
  { id: 23, title: '건강 브런치',                  done: false, day: '토', cat: '식습관', startMin: 10*60,      endMin: 10*60+30 },
  { id: 24, title: '낮잠 30분',                    done: false, day: '토', cat: '수면',  startMin: 14*60,      endMin: 14*60+30 },
  { id: 25, title: '자연 산책',                    done: false, day: '토', cat: '멘탈',  startMin: 17*60,      endMin: 18*60 },
  // 일요일
  { id: 26, title: '스트레칭 루틴 15분',           done: false, day: '일', cat: '자세',  startMin: 9*60,       endMin: 9*60+15 },
  { id: 27, title: '주간 영양 식단 계획',          done: false, day: '일', cat: '식습관', startMin: 11*60,      endMin: 11*60+30 },
  { id: 28, title: '주간 수면 리뷰',               done: false, day: '일', cat: '수면',  startMin: 15*60,      endMin: 15*60+30 },
  { id: 29, title: '주간 회고 작성',               done: false, day: '일', cat: '멘탈',  startMin: 19*60,      endMin: 19*60+30 },
];

export const PLAN_WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export const PLAN_CAT_STYLE = {
  '수면': { bg: '#ede9fe', text: '#4c1d95', shadow: 'rgba(167,139,250,0.15)' },
  '일정': { bg: '#dbeafe', text: '#1d4ed8', shadow: 'rgba(59,130,246,0.15)' },
  '자세': { bg: '#fce7f3', text: '#9d174d', shadow: 'rgba(244,114,182,0.15)' },
  '멘탈': { bg: '#d1fae5', text: '#064e3b', shadow: 'rgba(52,211,153,0.15)' },
  '일상': { bg: '#fee2e2', text: '#991b1b', shadow: 'rgba(248,113,113,0.15)' },
};

export const PLAN_CATEGORY_TO_API = {
  수면: 'sleep',
  일정: 'mental',
  자세: 'posture',
  멘탈: 'mental',
  일상: 'life',
};

export const CAT_STYLE = {
  '자세': { bg: '#fce7f3', text: '#9d174d', shadow: 'rgba(244,114,182,0.15)', defaultMin: 9 * 60 + 15 },
  '수면': { bg: '#ede9fe', text: '#4c1d95', shadow: 'rgba(167,139,250,0.15)', defaultMin: 10 * 60 + 30 },
  '식습관': { bg: '#fef9c3', text: '#713f12', shadow: 'rgba(251,191,36,0.15)', defaultMin: 12 * 60 },
  '멘탈': { bg: '#d1fae5', text: '#064e3b', shadow: 'rgba(52,211,153,0.15)', defaultMin: 13 * 60 + 30 },
  '일상': { bg: '#fee2e2', text: '#991b1b', shadow: 'rgba(248,113,113,0.15)', defaultMin: 15 * 60 },
};

export const ENG_LABELS = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
export const CAL_START_MIN = 0;
export const CAL_END_MIN = 24 * 60;
export const CAL_H = 24 * 48; // 48px per hour
export const PX_PER_MIN = CAL_H / (CAL_END_MIN - CAL_START_MIN);

export function minToY(min) {
  return (min - CAL_START_MIN) * PX_PER_MIN;
}
export function yToMin(y) {
  return CAL_START_MIN + y / PX_PER_MIN;
}
export function snapMin(min) {
  return Math.round(min / 30) * 30;
}
export function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function pickAICat(title) {
  if (/스트레칭|자세|운동|걷기|요가|스쿼트|기지개|목|허리|체조/.test(title)) return '자세';
  if (/수면|잠|취침|기상|낮잠|불면|휴식/.test(title)) return '수면';
  if (/먹|식사|점심|저녁|아침|식단|수분|물|영양|칼로리|간식|채소|과일/.test(title)) return '식습관';
  // posture/sleep/diet 어디에도 안 걸리면 '멘탈'보다 '일상'(병원 예약·행정 용무 등)이 더 정확한 catch-all이다.
  return '일상';
}

export function getWeekDates(weekOffset = 0) {
  const today = getNow();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return getWeekDatesFromAnchor(monday);
}

export function getWeekDatesFromAnchor(anchorDate) {
  const today = getNow();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(anchorDate);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    const label = koreanWeekdayLabels[d.getDay()];
    const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      label,
      date: d.getDate(),
      month: d.getMonth() + 1,
      isToday: d.toDateString() === today.toDateString(),
      isPast: dMidnight < todayMidnight,
      fullDate: d,
    };
  });
}

export function addCalendarDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameWeek(a, b) {
  return getMondayOfWeek(a).getTime() === getMondayOfWeek(b).getTime();
}

export function getWeekOffsetForDate(targetDate) {
  const todayMonday = getMondayOfWeek(getNow());
  const targetMonday = getMondayOfWeek(targetDate);
  return Math.round((targetMonday - todayMonday) / (7 * 24 * 60 * 60 * 1000));
}
