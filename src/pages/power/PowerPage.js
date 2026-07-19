import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import powerApi from '../../api/powerApi';
import { deviceDotClass, deviceDotTitle } from '../iot/iotUtils';
import { USE_CLIENT_POWER_SIM } from '../../api/config';
import { generatePowerComboTrend, generatePowerPeriodTrend } from '../../data/homeData';
import { InsightCard } from '../../components/report/InsightCard';
import { formatAnchorDate, resolvePowerReportRequest } from './powerReportUtils';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import thumbTuya from '../../img/device/thumbnail_tuya_ep2h.png';
import '../../components/report/report.css';
import './PowerPage.css';

// 한국전력 주택용(저압) 누진제 2단계(201~400kWh) 근사 단가 — 데모용 상수.
// 실제 요금은 기본요금·단계 구간·계절별 조정이 있으나, 여기서는 "선택 구간
// 누적 사용량 × 2단계 전력량요금"의 단순 근사치로 예상 요금을 보여준다.
const TIER2_WON_PER_KWH = 214.6;

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
  { id: 'w', short: 'W', suffix: '(실시간)' },
  { id: 'v', short: 'V', suffix: '(실시간)' },
  { id: 'a', short: 'A', suffix: '(실시간)' },
  { id: 'wh', short: 'Wh', suffix: '(누적)' },
];

const REPORT_PERIOD_MAP = { hour: '1h', day: '24h', week: '1w', month: '1mo', year: '1yr' };

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

const POLL_MS = 5000;

function fmtNum(value, digits = 1) {
  return value != null && Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function ChevronDownIcon(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Connection dot — mirrors IoT device list (green/orange/red by connectionStatus).
function ConnectionDot({ device }) {
  return (
    <span
      className={`device-dot ${deviceDotClass(device)}`}
      title={deviceDotTitle(device)}
    />
  );
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
function PowerReportBanner({ header, report, loading }) {
  const [visible, setVisible] = useState(true);
  const [display, setDisplay] = useState({ header, text: report?.text || '' });

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplay({ header, text: report?.text || '' });
      setVisible(true);
    }, 140);
    return () => clearTimeout(timer);
  }, [header, report?.text]);

  if (!report) return null;

  return (
    <div className={`power-report-banner${report.supported ? '' : ' unsupported'}${loading ? ' loading' : ''}`}>
      <span className="power-report-icon">✦</span>
      <div className="power-report-content">
        <h3 className="power-report-header">{display.header}</h3>
        <p className={`power-report-body${visible ? ' visible' : ''}`}>{display.text}</p>
      </div>
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
          <strong>{p.value != null ? Number(p.value).toFixed(p.dataKey === 'a' ? 3 : p.dataKey === 'v' ? 1 : 1) : '—'}{p.unit || ''}</strong>
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
  const isMobile = useMobileLayout();
  const [plugs, setPlugs] = useState([]);
  const [plugsLoading, setPlugsLoading] = useState(true);
  const [plugsError, setPlugsError] = useState('');
  const [selectedPlugId, setSelectedPlugId] = useState(() => loadLS(LS_SOURCE, 'all'));
  const [rangeTab, setRangeTab] = useState(() => loadLS(LS_RANGE, 'min1'));
  const [metricTab, setMetricTab] = useState(() => {
    const stored = loadLS(LS_METRIC, 'w');
    // 'va' was a combined tab before V/A became separate tabs — fall back cleanly.
    return METRIC_TABS.some((t) => t.id === stored) ? stored : 'w';
  });
  const [disabledSources, setDisabledSources] = useState(loadDisabledSources);
  const [liveValues, setLiveValues] = useState({}); // plugId -> { w, v, a }
  const [comboTrend, setComboTrend] = useState([]);
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
  const [insights, setInsights] = useState([]);
  const [powerReport, setPowerReport] = useState(null);
  const [reportHeader, setReportHeader] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [periodTrend, setPeriodTrend] = useState([]);

  useEffect(() => {
    powerApi.getInsights().then((items) => setInsights(items || [])).catch(() => setInsights([]));
  }, []);

  useEffect(() => {
    setSelectedBarIndex(null);
  }, [rangeTab, selectedPlugId]);

  const toggleInsight = async (id) => {
    const current = insights.find((item) => item.id === id);
    if (!current) return;
    const nextApproved = !current.approved;
    const result = await powerApi.updateInsight(id, { approved: nextApproved });
    if (result === null) return;
    setInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
  };

  useEffect(() => {
    const loadPlugs = () => powerApi.getPlugs()
      .then((list) => {
        setPlugs(list);
        setPlugsError('');
        if (!USE_CLIENT_POWER_SIM) {
          setLiveValues(Object.fromEntries(list.map((p) => ([
            p.id,
            {
              w: p.powerW ?? null,
              v: p.voltageV ?? null,
              a: p.currentMa != null ? p.currentMa / 1000 : null,
            },
          ]))));
        }
      })
      .catch((err) => {
        setPlugsError(err?.message || '전력 데이터를 불러오지 못했습니다.');
      })
      .finally(() => setPlugsLoading(false));
    loadPlugs();
    const t = setTimeout(() => setMounted(true), 80);
    const refresh = USE_CLIENT_POWER_SIM ? null : setInterval(loadPlugs, POLL_MS);
    return () => {
      clearTimeout(t);
      if (refresh) clearInterval(refresh);
    };
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

  // Live V/W/A simulation (1s) — mock only; real API refreshes plugs directly.
  useEffect(() => {
    if (!USE_CLIENT_POWER_SIM || plugs.length === 0) return;
    const tick = () => {
      setLiveValues((prev) => {
        const next = { ...prev };
        plugs.forEach((p) => {
          const base = prev[p.id] || { w: p.powerW, v: p.voltageV, a: (p.currentMa ?? 0) / 1000 };
          next[p.id] = {
            w: Math.max(0, +(base.w + (Math.random() - 0.5) * p.powerW * 0.08).toFixed(1)),
            v: p.voltageV ? +(235 + ((base.v ?? p.voltageV) - 235) * 0.4 + (Math.random() - 0.5) * 0.08).toFixed(1) : null,
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
  const barSelectable = metricTab === 'wh' && !isCombo;
  const { dateStr } = formatAnchorDate();

  // Period Wh charts: prefer DB-backed trend (demo/real); combo stays client-sim or live API.
  useEffect(() => {
    if (!selectedPlugId || isCombo) {
      setPeriodTrend([]);
      return undefined;
    }
    let cancelled = false;
    powerApi.getPeriodTrend({ deviceId: selectedPlugId, period: rangeTab, refDate: dateStr })
      .then((data) => { if (!cancelled) setPeriodTrend(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setPeriodTrend([]); });
    return () => { cancelled = true; };
  }, [selectedPlugId, rangeTab, isCombo, dateStr]);

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

  useEffect(() => {
    if (!selectedPlug || !isCombo || USE_CLIENT_POWER_SIM) return undefined;
    const loadTrend = () => {
      powerApi.getComboTrend({
        deviceId: selectedPlug.id,
        range: rangeTab,
        metric: metricTab,
      }).then(setComboTrend);
    };
    loadTrend();
    // 1분 차트는 매초 갱신해 타임라인이 흘러가게 하고, 그 외 콤보는 5초.
    const pollMs = rangeTab === 'min1' ? 1000 : POLL_MS;
    const timer = setInterval(loadTrend, pollMs);
    return () => clearInterval(timer);
  }, [selectedPlug, selectedPlug?.id, rangeTab, metricTab, isCombo]);

  // Keep hook order stable across renders (e.g. before `plugs` loads) via a safe fallback.
  const trendPlug = selectedPlug || { id: 'none', powerW: 0, voltageV: 0, currentMa: 0 };
  const rawTrend = useMemoTrend(trendPlug, rangeTab, isCombo);
  const chartData = useMemo(() => {
    if (!isCombo) {
      if (periodTrend.length > 0) return periodTrend;
      return rawTrend;
    }
    if (!USE_CLIENT_POWER_SIM) return comboTrend;
    // Attach synthesized V/A series (deterministic per-point jitter) for the V·A view
    const v0 = trendPlug.voltageV ?? 220;
    const a0 = (trendPlug.currentMa ?? 0) / 1000;
    return rawTrend.map((d, i) => ({
      ...d,
      v: +(v0 + Math.sin(i / 5) * 1.5).toFixed(1),
      a: +(a0 + Math.sin(i / 5 + 1) * a0 * 0.06).toFixed(3),
    }));
  }, [rawTrend, isCombo, trendPlug.voltageV, trendPlug.currentMa, comboTrend, periodTrend]);

  useEffect(() => {
    if (!selectedPlugId) return undefined;
    let cancelled = false;

    if (!REPORT_PERIOD_MAP[rangeTab]) {
      const { m, d } = formatAnchorDate();
      setReportHeader(`${m}월 ${d}일 기준 1시간 리포트`);
      setPowerReport({
        supported: false,
        text: '1분처럼 짧은 시간 간격에서는 데이터가 충분히 쌓이지 않아 의미 있는 소비 패턴을 분석하기 어려워요. 그래서 지금은 AI 리포트를 보여드리지 않고 있어요. 하단에서 1시간·일간·주간·월간·연간 중 하나를 선택하시면, 그 기간의 사용 패턴과 눈에 띄는 변화를 짚어주는 리포트를 확인하실 수 있어요.',
      });
      return undefined;
    }

    const request = resolvePowerReportRequest({
      rangeTab,
      selectedBarIndex: barSelectable ? selectedBarIndex : null,
      chartData,
    });
    setReportHeader(request.header);
    setReportLoading(true);

    powerApi.getReport({
      deviceId: selectedPlugId,
      period: request.period,
      periodStart: request.periodStart,
    })
      .then((data) => { if (!cancelled) setPowerReport(data); })
      .catch(() => {
        if (!cancelled) setPowerReport({ supported: true, text: '리포트 준비 중입니다.' });
      })
      .finally(() => { if (!cancelled) setReportLoading(false); });

    return () => { cancelled = true; };
  }, [selectedPlugId, rangeTab, selectedBarIndex, barSelectable, chartData]);

  const selectPeriodTab = (id) => {
    if (metricTab !== 'wh') return; // period tabs are disabled while W/VA is active
    setSelectedBarIndex(null);
    setRangeTab(id);
  };

  const selectComboRange = (id) => {
    setSelectedBarIndex(null);
    setRangeTab(id);
  };

  const selectMetricTab = (id) => {
    setSelectedBarIndex(null);
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

  if (plugsLoading && plugs.length === 0) {
    return (
      <div className="page-stack power-page">
        <p className="panel-loading">전력 데이터를 불러오는 중…</p>
      </div>
    );
  }

  if (!selectedPlug) {
    return (
      <div className="page-stack power-page">
        <p className="panel-empty">{plugsError || '표시할 전력 소스가 없습니다.'}</p>
      </div>
    );
  }

  const live = liveValues[selectedPlug.id] || {
    w: selectedPlug.powerW ?? null,
    v: selectedPlug.voltageV ?? null,
    a: selectedPlug.currentMa != null ? selectedPlug.currentMa / 1000 : null,
  };

  const peakW = isCombo ? Math.max(...chartData.map((d) => d.value ?? 0), 0) : 0;
  const totalWh = chartData.reduce((s, d) => s + (d.wh ?? 0), 0);
  const totalIsKwh = !isCombo && rangeTab === 'year';
  const estimatedCostWon = (totalWh / 1000) * TIER2_WON_PER_KWH;

  const metricTabControls = (
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
  );

  const rangeToolbarControls = (
    <div className="power-range-toolbar">
      <div className={`power-combo-wrap${isCombo ? ' active' : ''}`} ref={comboRef}>
        <button
          type="button"
          className="power-combo-label"
          onClick={() => selectComboRange(comboRange)}
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
                onClick={() => { selectComboRange(o.id); setComboMenuOpen(false); }}
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
  );

  return (
    <div className={`page-stack power-page${mounted ? ' mounted' : ''}`}>
      {/* ── Stat cards: 전력 | 전압 | 누적 | 예상 요금 ─────────────────────── */}
      <div className="power-stat-row">
        <StatCard label="전력" value={fmtNum(live.w, 1)} unit="W" accent live sub="현재 사용량" />
        <StatCard label="전압" value={fmtNum(live.v, 1)} unit="V" live sub={`${fmtNum(live.a, 3)} A`} />
        <StatCard
          label="누적"
          value={totalIsKwh ? totalWh.toFixed(1) : (totalWh > 1000 ? (totalWh / 1000).toFixed(2) : totalWh.toFixed(1))}
          unit={totalIsKwh ? 'kWh' : (totalWh > 1000 ? 'kWh' : 'Wh')}
          sub="선택 구간 합계"
        />
        <StatCard
          label="예상 요금"
          value={estimatedCostWon.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          unit="원"
          sub="누진 2단계 기준"
        />
      </div>

      {powerReport && (
        <PowerReportBanner header={reportHeader} report={powerReport} loading={reportLoading} />
      )}

      {/* ── Chart card ───────────────────────────────────────────────────── */}
      <div className="power-chart-card">
        <div className="power-chart-head">
          <div className="power-chart-title">
            <strong>{selectedPlugId === 'all' ? '전체 콘센트' : selectedPlug.name}</strong>
            <span>{selectedPlug.room}</span>
          </div>
        </div>

        <div className="power-chart-stage">
          <div className="power-chart-controls-bar">
            <div className="power-chart-controls-slot power-chart-controls-slot--metrics">
              {metricTabControls}
            </div>
            <div className="power-chart-controls-slot power-chart-controls-slot--range">
              {rangeToolbarControls}
            </div>
          </div>
          <PowerChart
            key={isCombo ? 'combo' : rangeTab}
            data={chartData}
            metricTab={metricTab}
            peakW={peakW}
            animate={animateChart}
            animToken={chartAnimToken}
            barSelectable={barSelectable}
            selectedBarIndex={selectedBarIndex}
            onBarSelect={setSelectedBarIndex}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* ── Power sources ────────────────────────────────────────────────── */}
      <h3 className="power-source-heading">전력 소스</h3>
      <div className="power-device-grid">
        {plugs.map((device) => {
          const isSelected = selectedPlugId === device.id;
          const isEnabled = !disabledSources.includes(device.id);
          const dLive = liveValues[device.id] || {
            w: device.powerW ?? null,
            v: device.voltageV ?? null,
            a: device.currentMa != null ? device.currentMa / 1000 : null,
          };
          const hourlyCost = dLive.w != null ? (dLive.w / 1000) * 250 : null;
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
                <ConnectionDot device={device} />
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
                  <strong className="power-device-w-big">{fmtNum(dLive.w, 1)}</strong>
                  <small>W</small>
                </div>
                <div className="power-device-bottom">
                  <span className="power-device-va">{fmtNum(dLive.v, 1)}V · {fmtNum(dLive.a, 3)}A</span>
                  <span className="power-device-cost">{hourlyCost != null ? `~${hourlyCost.toFixed(1)}원/h` : '—'}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {insights.length > 0 && (
        <div className="insight-section">
          <h3 className="insight-section-title">전력 인사이트</h3>
          <div className="insight-list">
            {insights.map((item) => (
              <InsightCard key={item.id} id={item.id} approved={item.approved} actionable={item.actionable} label={item.label} kind={item.kind} title={item.title} text={item.text} onToggle={toggleInsight} plainFooter />
            ))}
          </div>
        </div>
      )}
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

const axisProps = (isMobile) => ({
  tick: { fontSize: isMobile ? 9 : 11, fill: 'var(--sub)' },
  axisLine: false,
  tickLine: false,
});
const chartMarginDesktop = { top: 16, right: 16, bottom: 4, left: 8 };
const chartMarginMobile = { top: 8, right: 4, bottom: 6, left: -2 };
const Y_AXIS_WIDTH_DESKTOP = 52;
const Y_AXIS_WIDTH_MOBILE = 34;
const X_AXIS_ID = 'main';
const GRID_AXIS_ID = 'grid';
const MOBILE_GRID_INTERVAL = 3;

// Guarantees the Y axis always spans at least `minSpan` units (50V for
// voltage, 1A for current).
function minSpanDomain(minSpan) {
  const half = minSpan / 2;
  return [
    (dataMin, dataMax) => {
      if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return 0;
      return Math.min(dataMin, (dataMin + dataMax) / 2 - half);
    },
    (dataMin, dataMax) => {
      if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return minSpan;
      return Math.max(dataMax, (dataMin + dataMax) / 2 + half);
    },
  ];
}
const VOLTAGE_DOMAIN = minSpanDomain(50);
const CURRENT_DOMAIN = minSpanDomain(0.3);

function barFillColor(index, { selectedBarIndex, hoveredBarIndex, barSelectable }) {
  if (!barSelectable) return 'var(--wave-60)';
  if (selectedBarIndex === index) return 'var(--wave-40)';
  if (hoveredBarIndex === index) return 'var(--wave-deep)';
  return 'var(--wave-60)';
}

// Line-chart grid only — vertical lines align with every sample; labels are
// thinned separately via PowerXAxis so we never need a second hidden XAxis
// (that pattern broke V/A area rendering).
function PowerLineChartGrid({ isMobile }) {
  return (
    <>
      {isMobile && (
        <XAxis
          xAxisId={GRID_AXIS_ID}
          dataKey="label"
          hide
          interval={MOBILE_GRID_INTERVAL}
          axisLine={false}
          tickLine={false}
          tick={false}
        />
      )}
      <CartesianGrid
        xAxisId={isMobile ? GRID_AXIS_ID : X_AXIS_ID}
        stroke="var(--wave-30)"
        horizontal={false}
      />
      <CartesianGrid xAxisId={X_AXIS_ID} stroke="var(--ink-16)" strokeDasharray="3 3" vertical={false} />
    </>
  );
}

function PowerXAxis({ data, tickInterval, isMobile }) {
  const axis = axisProps(isMobile);
  if (tickInterval <= 0) {
    return <XAxis xAxisId={X_AXIS_ID} dataKey="label" interval={0} {...axis} />;
  }
  return (
    <XAxis
      xAxisId={X_AXIS_ID}
      dataKey="label"
      interval={0}
      axisLine={false}
      tickLine={false}
      tick={({ x, y, payload, index }) => {
        const show = index % (tickInterval + 1) === 0 || index === data.length - 1;
        if (!show) return null;
        return (
          <text x={x} y={y + 12} textAnchor="middle" fontSize={isMobile ? 9 : 11} fill="var(--sub)">
            {payload.value}
          </text>
        );
      }}
    />
  );
}

// ── Chart body: split single-purpose charts per metric ──────────────────────
function PowerChart({
  data,
  metricTab,
  peakW,
  animate,
  animToken,
  barSelectable,
  selectedBarIndex,
  onBarSelect,
  isMobile = false,
}) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const chartMargin = isMobile ? chartMarginMobile : chartMarginDesktop;
  const yAxisWidth = isMobile ? Y_AXIS_WIDTH_MOBILE : Y_AXIS_WIDTH_DESKTOP;
  const axis = axisProps(isMobile);
  const chartHeight = isMobile ? 232 : 240;

  // Combo ranges have 60 points — thin the x-axis labels down to ~5 for readability.
  const tickInterval = data.length > 24 ? Math.max(0, Math.ceil(data.length / 5) - 1) : 0;
  const whUnit = data[0]?.unitKwh ? 'kWh' : 'Wh';
  const yAxisWh = {
    width: yAxisWidth,
    ...axis,
    tickFormatter: (v) => (isMobile ? `${v}` : `${v} ${whUnit}`),
  };
  const yAxisW = {
    width: yAxisWidth,
    ...axis,
    tickFormatter: (v) => (isMobile ? `${v}` : `${v} W`),
    domain: [0, (max) => (max > 0 ? Math.ceil(max * 1.12) : 10)],
  };
  const whTooltipProps = {
    isAnimationActive: false,
    wrapperStyle: { transition: 'none' },
    cursor: false,
  };
  const lineTooltipProps = {
    isAnimationActive: false,
    wrapperStyle: { transition: 'none' },
    cursor: { stroke: 'var(--line)' },
  };

  const handleBarClick = (barData, index) => {
    if (!barSelectable) return;
    const i = typeof index === 'number' ? index : data.findIndex((d) => d === barData?.payload);
    if (i < 0) return;
    onBarSelect(selectedBarIndex === i ? null : i);
  };

  // 누적 Wh — 콤보(1분/10분/30분/1시간)와 기간(일/주/월/연) 모두 막대, 그리드 없음
  if (metricTab === 'wh') {
    return (
      <ChartRevealBox animate={animate} animToken={animToken}>
        <div className="power-chart" onMouseDown={(e) => e.preventDefault()}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data} margin={chartMargin}>
              <XAxis xAxisId={X_AXIS_ID} dataKey="label" interval={tickInterval} {...axis} />
              <YAxis yAxisId="left" {...yAxisWh} />
              <Tooltip content={<PowerTooltip />} {...whTooltipProps} />
              <Bar
                xAxisId={X_AXIS_ID}
                yAxisId="left"
                dataKey="wh"
                name="누적 에너지"
                unit={whUnit}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                activeBar={false}
                onClick={handleBarClick}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label ?? index}
                    fill={barFillColor(index, { selectedBarIndex, hoveredBarIndex, barSelectable })}
                    cursor={barSelectable ? 'pointer' : 'default'}
                    onMouseEnter={() => barSelectable && setHoveredBarIndex(index)}
                    style={{ transition: 'fill 0.18s ease' }}
                  />
                ))}
              </Bar>
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
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data} margin={chartMargin}>
              <PowerLineChartGrid isMobile={isMobile} />
              <PowerXAxis data={data} tickInterval={tickInterval} isMobile={isMobile} />
              <YAxis yAxisId="left" {...yAxisW} />
              <Tooltip content={<PowerTooltip />} {...lineTooltipProps} />
              <Area xAxisId={X_AXIS_ID} yAxisId="left" type="linear" dataKey="value" name="전력" unit="W"
                stroke="var(--power-green)" strokeWidth={2} dot={false}
                fill="var(--power-green)" fillOpacity={0.18} isAnimationActive={false} />
              {peakW > 0 && (
                <ReferenceLine yAxisId="left" y={peakW} stroke="var(--power-green)" strokeDasharray="4 3"
                  label={<PeakLabel value={peakW} />} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartRevealBox>
    );
  }

  // metricTab === 'v' / 'a': voltage and current — combo line charts only
  const isVoltage = metricTab === 'v';
  const seriesKey = isVoltage ? 'v' : 'a';
  const seriesName = isVoltage ? '전압' : '전류';
  const seriesUnit = isVoltage ? 'V' : 'A';
  const seriesColor = isVoltage ? 'var(--power-green)' : 'var(--accent-navy)';
  const yAxisVA = {
    width: yAxisWidth,
    ...axis,
    tickFormatter: (v) => (isMobile
      ? `${Number(v).toFixed(isVoltage ? 0 : 2)}`
      : `${Number(v).toFixed(isVoltage ? 1 : 3)} ${seriesUnit}`),
    domain: isVoltage ? VOLTAGE_DOMAIN : CURRENT_DOMAIN,
  };
  return (
    <ChartRevealBox animate={animate} animToken={animToken}>
      <div className="power-chart">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={data} margin={chartMargin}>
            <PowerLineChartGrid isMobile={isMobile} />
            <PowerXAxis data={data} tickInterval={tickInterval} isMobile={isMobile} />
            <YAxis yAxisId="left" {...yAxisVA} />
            <Tooltip content={<PowerTooltip />} {...lineTooltipProps} />
            <Area xAxisId={X_AXIS_ID} yAxisId="left" type="linear" dataKey={seriesKey} name={seriesName} unit={seriesUnit}
              stroke={seriesColor} strokeWidth={2} dot={false}
              fill={seriesColor} fillOpacity={0.18} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartRevealBox>
  );
}
