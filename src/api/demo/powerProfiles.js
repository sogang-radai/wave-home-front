import {
  generatePowerComboTrend,
  generatePowerPeriodTrend,
  generatePowerTenSecTrend,
  hashSeed,
  seededRandom,
} from '../../data/homeData';
import { hexId } from '../mock/devicesStore';

const VOLTAGE = 235.0;

function plugProfile({
  id,
  name,
  room,
  summary,
  powerW,
  switchOn = true,
}) {
  const currentMa = switchOn && powerW > 0
    ? Math.round((powerW / VOLTAGE) * 1000 * 10) / 10
    : 0;
  const hourlyCost = Math.round(powerW * 0.11 * 10) / 10;

  return {
    id,
    name,
    room,
    summary,
    power_w: powerW,
    voltage_v: VOLTAGE,
    current_ma: currentMa,
    switch: switchOn,
    hourlyCost,
    trend: {
      tenSec: generatePowerTenSecTrend(powerW, id),
    },
  };
}

const PLUG_AC = plugProfile({
  id: hexId(8),
  name: '플러그3 - 에어컨',
  room: '침실',
  summary: '냉방 부하가 안정적으로 유지되고 있습니다.',
  powerW: 600,
  switchOn: true,
});

const PLUG_PC = plugProfile({
  id: hexId(7),
  name: '플러그2 - 컴퓨터',
  room: '침실',
  summary: '업무 시간대에 일정한 소비 전력이 관측됩니다.',
  powerW: 100,
  switchOn: true,
});

const PLUG_FAN = plugProfile({
  id: hexId(6),
  name: '플러그1 - 선풍기',
  room: '거실',
  summary: '저전력 부하가 유지되고 있습니다.',
  powerW: 20,
  switchOn: true,
});

const PLUG_INDUCTION = plugProfile({
  id: hexId(9),
  name: '플러그4 - 인덕션',
  room: '부엌',
  summary: '조리 시간대에 짧게 소비가 집중됩니다.',
  powerW: 2400,
  switchOn: false,
});

const ACTIVE_PLUGS = [PLUG_AC, PLUG_PC, PLUG_FAN];

const ALL_POWER_W = ACTIVE_PLUGS.reduce((sum, plug) => sum + plug.power_w, 0);

export const DEMO_POWER_PLUGS = [
  plugProfile({
    id: 'all',
    name: '전체',
    room: '전체 콘센트',
    summary: '에어컨·컴퓨터·선풍기 합산 전력입니다.',
    powerW: ALL_POWER_W,
    switchOn: true,
  }),
  PLUG_FAN,
  PLUG_PC,
  PLUG_AC,
  PLUG_INDUCTION,
];

/** Live W with light noise around the profile base. */
export function demoLiveWatts(plugId, baseW) {
  if (baseW <= 0) {
    const rand = seededRandom(hashSeed(`${plugId}:idle:${Math.floor(Date.now() / 1000)}`));
    return +(rand() * 1.2).toFixed(1);
  }
  const rand = seededRandom(hashSeed(`${plugId}:live:${Math.floor(Date.now() / 1000)}`));
  const noise = (rand() - 0.5) * baseW * 0.08;
  return Math.max(0, +(baseW + noise).toFixed(1));
}

export function findDemoPlug(deviceId) {
  return DEMO_POWER_PLUGS.find((plug) => plug.id === deviceId);
}

export { generatePowerComboTrend, generatePowerPeriodTrend };
