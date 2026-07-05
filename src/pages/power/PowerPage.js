import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import homeApi from '../../api/homeApi';
import { generatePowerComboTrend, generatePowerPeriodTrend, hashSeed, seededRandom } from '../../data/homeData';
import thumbTuya from '../../img/device/thumbnail_tuya_ep2h.png';
import './PowerPage.css';

const COMBO_OPTIONS = [
  { id: 'min1', label: '1분' },
  { id: 'min10', label: '10분' },
  { id: 'min30', label: '30분' },
  { id: 'hour', label: '1시간' },
];
const PERIOD_OPTIONS = [
  { id: 'day', label: '일간' },
  { id: 'week', label: '주간' },
  { id: 'month', label: '월간' },
  { id: 'year', label: '연간' },
];
const COMBO_IDS = COMBO_OPTIONS.map((o) => o.id);
// Short label shown always; `suffix` is appended only while the tab is active,
// e.g. "W" -> "W 실시간" once selected.
const METRIC_TABS = [
  { id: 'w', short: 'W', suffix: '실시간' },
  { id: 'v', short: 'V', suffix: '실시간' },
  { id: 'a', short: 'A', suffix: '실시간' },
  { id: 'wh', short: 'Wh', suffix: '누적' },
];

// power_report.period 스키마에 정의된 단위만 AI 리포트를 제공한다 (docs/db-schema.md 참고).
// combo 의 min1/min10/min30 은 너무 짧아 리포트 대상이 아니다.
const REPORT_PERIOD_MAP = { hour: '1h', day: '24h', week: '1w', month: '1mo', year: '1yr' };
const REPORT_RANGE_LABEL = { hour: '최근 1시간', day: '오늘', week: '이번 주', month: '이번 달', year: '올해' };
const REPORT_WINDOW_DAYS = { week: 7, month: 30 };

const LS_METRIC = 'powerMetricTab';
const LS_RANGE = 'powerRangeTab';
const LS_SOURCE = 'powerSourceId';
const LS_DISABLED = 'powerDisabledSources';

function loadLS(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function loadDisabledSources() {
  try { return JSON.parse(localStorage.getItem(LS_DISABLED) || '[]'); } catch { return []; }
}

function LightningIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function LiveDot() {
  return <span className="power-live-dot" title="실시간" />;
}

function ChevronDownIcon(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Static (non-pulsing) dot used on source cards — a pulsing dot per-card was
// too busy once every card shows one; a single static dot communicates
// "live" without the visual noise.
function StaticDot() {
  return <span className="power-dot-static" title="실시간" />;
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, sub, accent, live }) {
  return (
    <div className={`power-stat-card${accent ? ' accent' : ''}`}>
      <span className="power-stat-label">
        {label}
        {live && <LiveDot />}
      </span>
      <div className="power-stat-value">
        <strong>{value}</strong>
        <small>{unit}</small>
      </div>
      {sub && <span className="power-stat-sub">{sub}</span>}
    </div>
  );
}

// ── AI report banner ─────────────────────────────────────────────────────
// power_report.metrics 의 energy_wh / peak_w / on_ratio / vs_prev_pct / avg_daily_wh
// 필드를 본떠 만든 목업 리포트. period 가 스키마에 없는 간격(1분/10분/30분)이면
// "리포트 없음" 안내를 보여준다.
function buildPowerReport(rangeTab, plug, totalWh, comboPeakW) {
  const schemaPeriod = REPORT_PERIOD_MAP[rangeTab];
  if (!schemaPeriod) {
    return {
      supported: false,
      text: '선택한 시간 간격은 너무 짧아 AI 리포트를 제공하지 않아요. 1시간 이상 단위(1시간·일간·주간·월간·연간)를 선택하면 리포트를 볼 수 있어요.',
    };
  }

  const rand = seededRandom(hashSeed(`${plug.id}:${rangeTab}:report`));
  const vsPrevPct = Math.round((rand() - 0.42) * 44);
  const onRatio = Math.round((0.32 + rand() * 0.55) * 100);
  const syntheticPeak = plug.powerW * (1.12 + rand() * 0.35);
  const peakW = comboPeakW > 0 ? comboPeakW : syntheticPeak;
  const whLabel = totalWh >= 1000 ? `${(totalWh / 1000).toFixed(2)}kWh` : `${totalWh.toFixed(1)}Wh`;
  const trendWord = vsPrevPct >= 0 ? '증가' : '감소';
  const deviceLabel = plug.id === 'all' ? '계측 플러그 전체 합산' : `${plug.name}(${plug.room})`;

  let text = `${REPORT_RANGE_LABEL[rangeTab]} ${deviceLabel} 사용량은 총 ${whLabel}예요. 피크는 ${peakW.toFixed(1)}W였고, 가동 비율은 ${onRatio}%로 이전 동일 기간 대비 ${Math.abs(vsPrevPct)}% ${trendWord}했어요.`;

  const windowDays = REPORT_WINDOW_DAYS[rangeTab];
  if (windowDays) {
    const avgDailyWh = totalWh / windowDays;
    const avgLabel = avgDailyWh >= 1000 ? `${(avgDailyWh / 1000).toFixed(2)}kWh` : `${avgDailyWh.toFixed(1)}Wh`;
    text += ` 최근 ${windowDays}일 창 기준 하루 평균 사용량은 ${avgLabel}예요.`;
  }

  return { supported: true, text, period: schemaPeriod };
}

function PowerReportBanner({ report }) {
  return (
    <div className={`power-report-banner${report.supported ? '' : ' unsupported'}`}>
      <span className="power-report-icon">✦</span>
      <p>{report.text}</p>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────
function PowerTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="power-tooltip">
      <div className="power-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="power-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span>
          <strong>{p.value != null ? Number(p.value).toFixed(p.dataKey === 'a' ? 3 : 2) : '—'}{p.unit || ''}</strong>
        </div>
      ))}
    </div>
  );
}

// Peak label rendered directly on the dashed reference line
function PeakLabel({ viewBox, value }) {
  if (!viewBox) return null;
  const { x, width, y } = viewBox;
  return (
    <g>
      <rect x={x + width - 84} y={y - 17} width="80" height="17" rx="4" fill="var(--power-green)" opacity="0.92" />
      <text x={x + width - 44} y={y - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff">
        {`피크 ${value.toFixed(1)}W`}
      </text>
    </g>
  );
}

export function PowerPage() {
  const [plugs, setPlugs] = useState([]);
  const [selectedPlugId, setSelectedPlugId] = useState(() => loadLS(LS_SOURCE, 'all'));
  const [rangeTab, setRangeTab] = useState(() => loadLS(LS_RANGE, 'min1'));
  const [metricTab, setMetricTab] = useState(() => {
    const stored = loadLS(LS_METRIC, 'w');
    // 'va' was a combined tab before V/A became separate tabs — fall back cleanly.
    return METRIC_TABS.some((t) => t.id === stored) ? stored : 'w';
  });
  const [disabledSources, setDisabledSources] = useState(loadDisabledSources);
  const [liveValues, setLiveValues] = useState({}); // plugId -> { w, v, a }
  const [mounted, setMounted] = useState(false);
  const [chartAnimToken, setChartAnimToken] = useState(0);
  const [animateChart, setAnimateChart] = useState(true);
  const prevRangeTabRef = useRef(null);

  // Remembers the last combo interval chosen, so the label keeps showing a
  // real interval (never a "콤보" placeholder) even after switching to a
  // period tab (일간/주간/월간/연간).
  const [comboRange, setComboRange] = useState(() => {
    const stored = loadLS(LS_RANGE, 'min1');
    return COMBO_IDS.includes(stored) ? stored : 'min1';
  });
  const [comboMenuOpen, setComboMenuOpen] = useState(false);
  const comboRef = useRef(null);

  useEffect(() => {
    homeApi.getPowerPlugs().then(setPlugs);
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Persist selections
  useEffect(() => saveLS(LS_METRIC, metricTab), [metricTab]);
  useEffect(() => saveLS(LS_RANGE, rangeTab), [rangeTab]);
  useEffect(() => saveLS(LS_SOURCE, selectedPlugId), [selectedPlugId]);
  useEffect(() => {
    try { localStorage.setItem(LS_DISABLED, JSON.stringify(disabledSources)); } catch { /* ignore */ }
  }, [disabledSources]);

  // Keep `comboRange` in sync whenever a combo interval is actually active.
  useEffect(() => {
    if (COMBO_IDS.includes(rangeTab)) setComboRange(rangeTab);
  }, [rangeTab]);

  // Close the combo dropdown when clicking outside of it.
  useEffect(() => {
    if (!comboMenuOpen) return undefined;
    const onDocPointerDown = (e) => {
      if (!comboRef.current?.contains(e.target)) setComboMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [comboMenuOpen]);

  // Live V/W/A simulation (1s) — runs for every plug so source cards stay live
  useEffect(() => {
    if (plugs.length === 0) return;
    const tick = () => {
      setLiveValues((prev) => {
        const next = { ...prev };
        plugs.forEach((p) => {
          const base = prev[p.id] || { w: p.powerW, v: p.voltageV, a: (p.currentMa ?? 0) / 1000 };
          next[p.id] = {
            w: Math.max(0, +(base.w + (Math.random() - 0.5) * p.powerW * 0.08).toFixed(1)),
            v: p.voltageV ? +(p.voltageV + (Math.random() - 0.5) * 1.2).toFixed(1) : null,
            a: p.currentMa ? Math.max(0, +((p.currentMa / 1000) + (Math.random() - 0.5) * 0.02).toFixed(3)) : null,
          };
        });
        return next;
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [plugs]);

  const isCombo = COMBO_IDS.includes(rangeTab);

  // Trigger chart-enter animation on mount, and whenever the transition crosses
  // the combo/period boundary or moves between two different period tabs —
  // but never for switches *within* the combo group (min1 <-> min10 etc).
  useEffect(() => {
    const prev = prevRangeTabRef.current;
    prevRangeTabRef.current = rangeTab;
    const isFirstRun = prev === null;
    const bothCombo = !isFirstRun && COMBO_IDS.includes(prev) && isCombo;
    if (isFirstRun || !bothCombo) {
      setChartAnimToken((t) => t + 1);
      setAnimateChart(true);
    } else {
      setAnimateChart(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeTab]);

  const selectedPlug = plugs.find((p) => p.id === selectedPlugId) || plugs[0] || null;

  // Keep hook order stable across renders (e.g. before `plugs` loads) via a safe fallback.
  const trendPlug = selectedPlug || { id: 'none', powerW: 0, voltageV: 0, currentMa: 0 };
  const rawTrend = useMemoTrend(trendPlug, rangeTab, isCombo);
  const chartData = useMemo(() => {
    if (!isCombo) return rawTrend;
    // Attach synthesized V/A series (deterministic per-point jitter) for the V·A view
    const v0 = trendPlug.voltageV ?? 220;
    const a0 = (trendPlug.currentMa ?? 0) / 1000;
    return rawTrend.map((d, i) => ({
      ...d,
      v: +(v0 + Math.sin(i / 5) * 1.5).toFixed(1),
      a: +(a0 + Math.sin(i / 5 + 1) * a0 * 0.06).toFixed(3),
    }));
  }, [rawTrend, isCombo, trendPlug.voltageV, trendPlug.currentMa]);

  const selectPeriodTab = (id) => {
    if (metricTab !== 'wh') return; // period tabs are disabled while W/VA is active
    setRangeTab(id);
  };

  const selectMetricTab = (id) => {
    setMetricTab(id);
    if (id !== 'wh' && !isCombo) setRangeTab('hour');
  };

  const toggleSourceEnabled = (id) => {
    setDisabledSources((prev) => {
      const isDisabled = prev.includes(id);
      if (isDisabled) return prev.filter((x) => x !== id);
      if (selectedPlugId === id) setSelectedPlugId('all');
      return [...prev, id];
    });
  };

  if (!selectedPlug) return <div className="page-stack power-page" />;

  const live = liveValues[selectedPlug.id] || { w: selectedPlug.powerW, v: selectedPlug.voltageV, a: (selectedPlug.currentMa ?? 0) / 1000 };

  const peakW = isCombo ? Math.max(...chartData.map((d) => d.value ?? 0), 0) : 0;
  const totalWh = chartData.reduce((s, d) => s + (d.wh ?? 0), 0);
  const totalIsKwh = !isCombo && rangeTab === 'year';
  const report = buildPowerReport(rangeTab, selectedPlug, totalWh, peakW);

  return (
    <div className={`page-stack power-page${mounted ? ' mounted' : ''}`}>
      {/* ── Stat cards: 전력 | 전압 | 피크 | 누적 ─────────────────────────── */}
      <div className="power-stat-row">
        <StatCard label="전력" value={live.w?.toFixed(1) ?? '—'} unit="W" accent live sub="현재 사용량" />
        <StatCard label="전압" value={live.v?.toFixed(1) ?? '—'} unit="V" live sub={`${(live.a ?? 0).toFixed(2)} A`} />
        {isCombo ? (
          <StatCard label="피크" value={peakW.toFixed(1)} unit="W" sub="선택 구간 최대값" />
        ) : (
          <div className="power-stat-card power-stat-card--empty" />
        )}
        <StatCard
          label="누적"
          value={totalIsKwh ? totalWh.toFixed(1) : (totalWh > 1000 ? (totalWh / 1000).toFixed(2) : totalWh.toFixed(1))}
          unit={totalIsKwh ? 'kWh' : (totalWh > 1000 ? 'kWh' : 'Wh')}
          sub="선택 구간 합계"
        />
      </div>

      {/* ── Chart card ───────────────────────────────────────────────────── */}
      <div className="power-chart-card">
        <div className="power-chart-head">
          <div className="power-chart-title">
            <strong>{selectedPlugId === 'all' ? '전체 콘센트' : selectedPlug.name}</strong>
            <span>{selectedPlug.room}</span>
          </div>
          <div className="power-chart-controls">
            <div className="power-tab-group">
              {METRIC_TABS.map((t) => {
                const active = metricTab === t.id;
                return (
                  <button
                    key={t.id}
                    className={`power-tab${active ? ' active' : ''}`}
                    onClick={() => selectMetricTab(t.id)}
                  >
                    {t.short}
                    {active && <span className="power-tab-suffix"> {t.suffix}</span>}
                  </button>
                );
              })}
            </div>
            {/* Combo interval + period tabs merged into a single pill so it reads
                as one control: |1분ˇ|일간|주간|월간|연간|. Clicking the interval
                text selects it directly; the chevron opens the interval picker. */}
            <div className="power-range-toolbar">
              <div className={`power-combo-wrap${isCombo ? ' active' : ''}`} ref={comboRef}>
                <button
                  type="button"
                  className="power-combo-label"
                  onClick={() => setRangeTab(comboRange)}
                >
                  {COMBO_OPTIONS.find((o) => o.id === comboRange)?.label}
                </button>
                <button
                  type="button"
                  className="power-combo-caret-btn"
                  aria-label="시간 간격 선택"
                  onClick={() => setComboMenuOpen((v) => !v)}
                >
                  <ChevronDownIcon />
                </button>
                {comboMenuOpen && (
                  <div className="power-combo-menu">
                    {COMBO_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        className={`power-combo-menu-item${isCombo && rangeTab === o.id ? ' active' : ''}`}
                        onClick={() => { setRangeTab(o.id); setComboMenuOpen(false); }}
                      >{o.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <span className="power-toolbar-divider" aria-hidden="true" />
              {PERIOD_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  className={`power-tab${rangeTab === t.id ? ' active' : ''}`}
                  disabled={metricTab !== 'wh'}
                  onClick={() => selectPeriodTab(t.id)}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        <PowerReportBanner report={report} />

        <PowerChart
          key={isCombo ? 'combo' : rangeTab}
          data={chartData}
          metricTab={metricTab}
          isCombo={isCombo}
          peakW={peakW}
          animate={animateChart}
          animToken={chartAnimToken}
        />
      </div>

      {/* ── Power sources ────────────────────────────────────────────────── */}
      <h3 className="power-source-heading">전력 소스</h3>
      <div className="power-device-grid">
        {plugs.map((device) => {
          const isSelected = selectedPlugId === device.id;
          const isEnabled = !disabledSources.includes(device.id);
          const dLive = liveValues[device.id] || { w: device.powerW, v: device.voltageV, a: (device.currentMa ?? 0) / 1000 };
          const hourlyCost = (dLive.w ?? 0) / 1000 * 250; // mock: ~250원/kWh
          return (
            <div
              key={device.id}
              className={`power-device-card${isSelected ? ' selected' : ''}${!isEnabled ? ' disabled' : ''}`}
            >
              {/* Toggle controls whether this source counts toward stats — it does
                  NOT reflect connectivity, so the online dot below it stays green
                  as long as the device is connected, regardless of toggle state. */}
              <div className="power-device-side">
                <button
                  type="button"
                  className={`toggle-switch toggle-switch--sm power-device-toggle${isEnabled ? ' on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSourceEnabled(device.id); }}
                  aria-label={isEnabled ? `${device.name} 비활성화` : `${device.name} 활성화`}
                  title={isEnabled ? '비활성화' : '활성화'}
                >
                  <i />
                </button>
                <StaticDot />
              </div>
              <button
                type="button"
                className="power-device-body"
                disabled={!isEnabled}
                onClick={() => setSelectedPlugId(device.id)}
              >
                <div className="power-device-top">
                  <div className="power-device-thumb">
                    {device.id === 'all' ? <LightningIcon /> : <img src={thumbTuya} alt="" />}
                  </div>
                  <div className="power-device-info">
                    <span className="power-device-room">{device.room}</span>
                    <strong className="power-device-name" title={device.name}>{device.name}</strong>
                  </div>
                </div>
                <div className="power-device-center">
                  <strong className="power-device-w-big">{dLive.w?.toFixed(1) ?? '—'}</strong>
                  <small>W</small>
                </div>
                <div className="power-device-bottom">
                  <span className="power-device-va">{dLive.v?.toFixed(0) ?? '—'}V · {(dLive.a ?? 0).toFixed(2)}A</span>
                  <span className="power-device-cost">~{hourlyCost.toFixed(1)}원/h</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Memoized trend-data lookup so the same array reference is reused across
// renders unless the plug/range actually changes (keeps chart re-renders cheap).
function useMemoTrend(plug, rangeTab, isCombo) {
  return useMemo(() => {
    if (isCombo) return generatePowerComboTrend(rangeTab, plug.powerW, plug.id);
    return generatePowerPeriodTrend(rangeTab, plug.powerW, plug.id);
  }, [plug.id, plug.powerW, rangeTab, isCombo]);
}

// Wraps chart content in a container that reveals top-down on mount/range
// change (via CSS clip-path), remounted only when `animToken` changes so
// intra-combo tab switches never re-trigger it.
function ChartRevealBox({ animate, animToken, children }) {
  return (
    <div key={animToken} className={`power-chart-reveal${animate ? ' animate' : ''}`}>
      {children}
    </div>
  );
}

const commonAxisProps = { tick: { fontSize: 11, fill: 'var(--sub)' }, axisLine: false, tickLine: false };
const chartMargin = { top: 12, right: 16, bottom: 0, left: 0 };

// ── Chart body: split single-purpose charts per metric ──────────────────────
function PowerChart({ data, metricTab, isCombo, peakW, animate, animToken }) {
  // Combo ranges have 60 points — thin the x-axis labels down to ~5 for readability.
  const tickInterval = isCombo ? Math.max(0, Math.ceil(data.length / 5) - 1) : 0;
  const whUnit = data[0]?.unitKwh ? 'kWh' : 'Wh';
  const tooltipProps = { isAnimationActive: false, wrapperStyle: { transition: 'none' }, cursor: { stroke: 'var(--line)' } };

  if (metricTab === 'wh' || !isCombo) {
    return (
      <ChartRevealBox animate={animate} animToken={animToken}>
        <div className="power-chart">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
              <XAxis dataKey="label" interval={tickInterval} {...commonAxisProps} />
              <YAxis width={40} unit={whUnit} {...commonAxisProps} />
              <Tooltip content={<PowerTooltip />} {...tooltipProps} />
              <Bar dataKey="wh" name="누적 에너지" unit={whUnit} fill="var(--power-blue)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartRevealBox>
    );
  }

  if (metricTab === 'w') {
    return (
      <ChartRevealBox animate={animate} animToken={animToken}>
        <div className="power-chart">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
              <XAxis dataKey="label" interval={tickInterval} {...commonAxisProps} />
              <YAxis width={44} unit="W" domain={[0, 'auto']} {...commonAxisProps} />
              <Tooltip content={<PowerTooltip />} {...tooltipProps} />
              <Area type="linear" dataKey="value" name="전력" unit="W"
                stroke="var(--power-green)" strokeWidth={2} dot={false}
                fill="var(--power-green)" fillOpacity={0.18} isAnimationActive={false} />
              {peakW > 0 && (
                <ReferenceLine y={peakW} stroke="var(--power-green)" strokeDasharray="4 3"
                  label={<PeakLabel value={peakW} />} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartRevealBox>
    );
  }

  // metricTab === 'v' / 'a': voltage and current now live as fully separate
  // tabs (not a stacked split-view), each with a full-height chart.
  const isVoltage = metricTab === 'v';
  const seriesKey = isVoltage ? 'v' : 'a';
  const seriesName = isVoltage ? '전압' : '전류';
  const seriesUnit = isVoltage ? 'V' : 'A';
  const seriesColor = isVoltage ? 'var(--power-green)' : 'var(--accent-navy)';
  return (
    <ChartRevealBox animate={animate} animToken={animToken}>
      <div className="power-chart">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
            <XAxis dataKey="label" interval={tickInterval} {...commonAxisProps} />
            <YAxis width={44} unit={seriesUnit} domain={['auto', 'auto']} {...commonAxisProps} />
            <Tooltip content={<PowerTooltip />} {...tooltipProps} />
            <Area type="linear" dataKey={seriesKey} name={seriesName} unit={seriesUnit}
              stroke={seriesColor} strokeWidth={2} dot={false}
              fill={seriesColor} fillOpacity={0.18} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartRevealBox>
  );
}
