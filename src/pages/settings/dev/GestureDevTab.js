import { useEffect, useRef, useState } from 'react';
import iotApi from '../../../api/iotApi';
import devApi from '../../../api/devApi';
import { COLORMAP_NAMES, embeddingDisplayValue, sampleColormap } from './colormaps';

function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}시간 ${m}분 ${s}초`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function wsStateLabel(state) {
  if (state === 'live') return '연결됨';
  if (state === 'connecting') return '연결 중…';
  if (state === 'error') return '오류';
  return '끊김';
}

function ThresholdBar({ score, high, low, state }) {
  const pct = Math.max(0, Math.min(100, score * 100));
  const highPct = high * 100;
  const lowPct = low * 100;
  return (
    <div className="dev-threshold-bar" aria-hidden="true">
      <div className="dev-threshold-zone low" style={{ width: `${lowPct}%` }} />
      <div
        className="dev-threshold-zone mid"
        style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
      />
      <div className="dev-threshold-marker high" style={{ left: `${highPct}%` }} title={`High ${high.toFixed(2)}`} />
      <div className="dev-threshold-marker low" style={{ left: `${lowPct}%` }} title={`Low ${low.toFixed(2)}`} />
      <div className={`dev-threshold-fill ${state || ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EmbeddingHeatmap({ values, embedDim, sequenceLength, colormap }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !values?.length || !embedDim || !sequenceLength) return;

    const displayRows = Math.min(embedDim, 64);
    const rowStride = Math.max(1, Math.floor(embedDim / displayRows));
    const cols = sequenceLength;

    const width = canvas.clientWidth || 600;
    const height = Math.max(180, displayRows * 4);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const cellW = width / cols;
    const cellH = height / displayRows;

    for (let r = 0; r < displayRows; r += 1) {
      const srcR = Math.min(embedDim - 1, r * rowStride);
      for (let c = 0; c < cols; c += 1) {
        const raw = values[c * embedDim + srcR] ?? 0;
        const t = embeddingDisplayValue(raw);
        ctx.fillStyle = sampleColormap(colormap, t);
        ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }, [values, embedDim, sequenceLength, colormap]);

  if (!values?.length || !sequenceLength) {
    return <div className="dev-empty">임베딩 데이터를 기다리는 중…</div>;
  }

  return (
    <div className="dev-embedding-panel">
      <div className="dev-embedding-axis">
        <span>차원</span>
        <span>시퀀스 →</span>
      </div>
      <canvas ref={canvasRef} className="dev-embedding-canvas" />
    </div>
  );
}

export function GestureDevTab() {
  const [radars, setRadars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [snap, setSnap] = useState(null);
  const [wsState, setWsState] = useState('closed');
  const [colormap, setColormap] = useState('Viridis');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [devices, gestureSets] = await Promise.all([
          iotApi.getDevices(),
          iotApi.getGestureSets().catch(() => []),
        ]);
        const setNameById = Object.fromEntries(
          (Array.isArray(gestureSets) ? gestureSets : []).map((s) => [String(s.id), s.name || String(s.id)]),
        );

        const radarDevices = (Array.isArray(devices) ? devices : [])
          .filter((d) => d.class === 'srs_r4sn');

        const bound = [];
        await Promise.all(radarDevices.map(async (device) => {
          try {
            const assignment = await iotApi.getRadarGestureSet(device.id);
            if (assignment?.gestureSetId) {
              const setId = String(assignment.gestureSetId);
              bound.push({
                ...device,
                gestureSetId: setId,
                gestureSetName: setNameById[setId] || setId,
              });
            }
          } catch {
            // skip unbound / unreachable
          }
        }));

        if (!active) return;
        bound.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
        setRadars(bound);
        setSelectedId((prev) => {
          if (prev && bound.some((d) => d.id === prev)) return prev;
          return bound[0]?.id ?? null;
        });
      } catch {
        if (active) setRadars([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setSnap(null);
    if (!selectedId) {
      setWsState('closed');
      return undefined;
    }
    const sub = devApi.subscribeDevStream(selectedId, {
      onSnapshot: setSnap,
      onState: setWsState,
    });
    return () => sub.close();
  }, [selectedId]);

  const labels = snap?.classLabels ?? {};
  const probs = snap?.probabilities ?? [];
  const selected = radars.find((d) => d.id === selectedId);

  if (loading) {
    return <p className="settings-panel-desc">레이더 목록을 불러오는 중…</p>;
  }

  if (radars.length === 0) {
    return (
      <p className="settings-panel-desc">
        제스처 셋이 할당된 레이더가 없습니다. IoT 제어에서 레이더에 제스처 셋을 먼저 지정하세요.
      </p>
    );
  }

  return (
    <div className="dev-gesture-tab">
      <div className="dev-radar-grid" role="listbox" aria-label="레이더 선택">
        {radars.map((device) => (
          <button
            key={device.id}
            type="button"
            role="option"
            aria-selected={selectedId === device.id}
            className={`dev-radar-card${selectedId === device.id ? ' selected' : ''}${!device.connected ? ' offline' : ''}`}
            onClick={() => setSelectedId(device.id)}
          >
            <span className={`dev-radar-dot ${device.connected ? 'on' : 'off'}`} />
            <div className="dev-radar-card-body">
              <div className="dev-radar-card-row">
                <span className="dev-radar-card-label">장치 이름</span>
                <strong className="dev-radar-card-value" title={device.name}>{device.name}</strong>
              </div>
              <div className="dev-radar-card-row">
                <span className="dev-radar-card-label">장치 ID</span>
                <span className="dev-radar-card-value mono" title={device.id}>{device.id}</span>
              </div>
              <div className="dev-radar-card-row">
                <span className="dev-radar-card-label">제스처 셋 이름</span>
                <span className="dev-radar-card-value" title={device.gestureSetName}>{device.gestureSetName}</span>
              </div>
              <div className="dev-radar-card-row">
                <span className="dev-radar-card-label">제스처 셋 ID</span>
                <span className="dev-radar-card-value mono" title={device.gestureSetId}>{device.gestureSetId}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="dev-stream-meta">
        <span>
          {selected?.name || '레이더'}
          {' · '}
          WebSocket:
          {' '}
          <em className={`dev-ws-state ${wsState}`}>{wsStateLabel(wsState)}</em>
        </span>
      </div>

      <div className="dev-grid">
        <article className="dev-panel dev-wide">
          <h3>레이더 정보</h3>
          <dl className="dev-kv two-col">
            <div><dt>가동 시간</dt><dd>{formatUptime(snap?.serverUptimeSec ?? 0)}</dd></div>
            <div><dt>활성 셋</dt><dd>{snap?.activeSetId || '—'}</dd></div>
            <div><dt>연결</dt><dd>{snap?.radar?.connected ? '연결됨' : '끊김'}</dd></div>
            <div><dt>IP</dt><dd>{snap?.radar?.ip || '—'}</dd></div>
            <div><dt>MAC</dt><dd>{snap?.radar?.mac || '—'}</dd></div>
            <div><dt>모델</dt><dd>{snap?.radar?.model || '—'}</dd></div>
            <div><dt>프레임</dt><dd>{snap?.radar?.frameRateHz?.toFixed?.(1) ?? '0'} Hz</dd></div>
            <div><dt>타깃 수</dt><dd>{snap?.radar?.targetCount ?? 0}</dd></div>
          </dl>
        </article>

        <article className="dev-panel dev-wide">
          <h3>클래스 확률</h3>
          {probs.length > 0 ? (
            <div className="dev-prob-list">
              {probs.map((p, idx) => (
                <div className="dev-prob-row" key={idx}>
                  <span className="dev-prob-label">{labels[String(idx)] ?? `class ${idx}`}</span>
                  <div className="dev-prob-track">
                    <div
                      className="dev-prob-fill"
                      style={{ width: `${Math.min(100, Math.max(0, p) * 100)}%` }}
                    />
                  </div>
                  <span className="dev-prob-value">{(Math.max(0, p) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dev-empty">확률 데이터를 기다리는 중…</div>
          )}
        </article>

        <article className="dev-panel dev-wide">
          <div className="dev-section-head">
            <h3>Sequence Embedding</h3>
            <label className="dev-colormap-select">
              <span>컬러맵</span>
              <select
                className="settings-select"
                value={colormap}
                onChange={(e) => setColormap(e.target.value)}
              >
                {COLORMAP_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <EmbeddingHeatmap
            values={snap?.embedding?.values}
            embedDim={snap?.embedding?.embedDim}
            sequenceLength={snap?.embedding?.sequenceLength}
            colormap={colormap}
          />
        </article>

        <article className="dev-panel dev-wide">
          <h3>Trigger Channels</h3>
          {(snap?.channels ?? []).length > 0 ? (
            <div className="dev-trigger-grid">
              {(snap?.channels ?? []).map((ch) => (
                <div className="dev-trigger-card" key={ch.gestureClassId}>
                  <div className="dev-trigger-head">
                    <strong>{labels[String(ch.gestureClassId)] ?? `class ${ch.gestureClassId}`}</strong>
                    <span className={`dev-status-pill ${ch.ready ? 'ready' : 'cool'}`}>
                      {ch.ready ? 'Ready' : 'Cooling'}
                    </span>
                  </div>
                  <ThresholdBar
                    score={Math.max(0, ch.score)}
                    high={ch.highThreshold}
                    low={ch.lowThreshold}
                    state={ch.state}
                  />
                  <dl className="dev-kv compact">
                    <div><dt>상태</dt><dd>{ch.state}</dd></div>
                    <div><dt>점수</dt><dd>{ch.score?.toFixed?.(3) ?? '—'}</dd></div>
                    <div><dt>High</dt><dd>{ch.highThreshold}</dd></div>
                    <div><dt>Low</dt><dd>{ch.lowThreshold}</dd></div>
                    <div><dt>쿨다운</dt><dd>{ch.cooldownMs} ms</dd></div>
                    <div><dt>Min High</dt><dd>{ch.minHighHoldMs} ms</dd></div>
                    <div><dt>Min Low</dt><dd>{ch.minLowHoldMs} ms</dd></div>
                    <div><dt>모드</dt><dd>{ch.triggerMode ?? 'pulse'}</dd></div>
                    <div><dt>반복</dt><dd>{ch.repeatIntervalMs ?? 0} ms</dd></div>
                    <div><dt>Hold</dt><dd>{ch.holdProgressMs ?? 0} / {ch.holdRequiredMs ?? 0} ms</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div className="dev-empty">채널 데이터를 기다리는 중…</div>
          )}
        </article>
      </div>
    </div>
  );
}
