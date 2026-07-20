import { useEffect, useState } from 'react';
import iotApi from '../../../api/iotApi';
import { dispatchTwinDeviceState } from '../../../lib/twinSceneStore';
import { ColorWheel } from './ColorWheel';

function unwrapState(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const nested = payload.state;
  if (nested && typeof nested === 'object' && (nested.on !== undefined || nested.switch !== undefined)) {
    return nested;
  }
  return payload;
}

// Row-major order for a 3×5 grid (가로 3, 세로 5).
const PRESET_COLORS = [
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 214, b: 170 },
  { r: 255, g: 99, b: 99 },
  { r: 255, g: 176, b: 59 },
  { r: 255, g: 235, b: 59 },
  { r: 96, g: 219, b: 108 },
  { r: 59, g: 201, b: 219 },
  { r: 89, g: 125, b: 255 },
  { r: 167, g: 89, b: 255 },
  { r: 255, g: 89, b: 199 },
  { r: 255, g: 140, b: 66 },
  { r: 120, g: 255, b: 214 },
  { r: 64, g: 158, b: 255 },
  { r: 232, g: 67, b: 147 },
  { r: 186, g: 104, b: 200 },
];

const TEMP_GRADIENT = 'linear-gradient(to right, #ff9329, #ffcf94, #fff6ea, #d8ecff, #9dc4ff)';
const TEMP_MIN = 2200;
const TEMP_MAX = 6500;

function kelvinToRgb(kelvin) {
  const temp = kelvin / 100;
  let r;
  let g;
  let b;
  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    b = temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * (temp - 60) ** -0.1332047592));
    g = Math.min(255, Math.max(0, 288.1221695283 * (temp - 60) ** -0.0755148492));
    b = 255;
  }
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

function rgbToHex({ r = 0, g = 0, b = 0 } = {}) {
  const toHex = (n) => Math.max(0, Math.min(255, Number(n) || 0)).toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function TemperatureSlider({ value, onChange, onCommit }) {
  const safeValue = Number.isFinite(value) ? value : 4000;
  const preview = kelvinToRgb(safeValue);
  const previewCss = `rgb(${preview.r}, ${preview.g}, ${preview.b})`;
  const pct = ((safeValue - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
  return (
    <div
      className="temp-slider-wrap"
      style={{
        '--temp-position': `${pct}%`,
        '--temp-preview': previewCss,
        '--temp-gradient': TEMP_GRADIENT,
      }}
    >
      <input
        type="range"
        min={TEMP_MIN}
        max={TEMP_MAX}
        step="100"
        value={safeValue}
        className="temp-slider temp-slider--preview"
        onChange={(event) => onChange(Number(event.target.value))}
        onMouseUp={(event) => onCommit(Number(event.target.value))}
        onTouchEnd={(event) => onCommit(Number(event.target.value))}
        aria-label="색온도"
      />
      <span className="temp-slider-knob" style={{ background: previewCss }} aria-hidden="true" />
    </div>
  );
}

function PowerToggle({ on, onToggle }) {
  return (
    <div className="panel-section">
      <span className="device-panel-label">On/Off</span>
      <div className="plug-power-row">
        <button
          type="button"
          className={`toggle-switch toggle-switch--lg${on ? ' on' : ''}`}
          onClick={onToggle}
          aria-label="전원 토글"
        >
          <i />
        </button>
        <span className="plug-power-label">{on ? '켜짐' : '꺼짐'}</span>
      </div>
    </div>
  );
}

// philips_wiz_e29_color / _white — on/off/toggle + brightness, plus either
// RGB color (color variant) or color temperature (white/tunable variant).
export function LightPanel({ device, onChanged }) {
  const [state, setState] = useState(null);
  const [dragBrightness, setDragBrightness] = useState(null);
  const isColor = device.class === 'philips_wiz_e29_color';

  useEffect(() => {
    setState(null);
    iotApi.getDeviceState(device.id).then((payload) => setState(unwrapState(payload)));
  }, [device.id]);

  const invoke = async (name, params) => {
    // Optimistic twin update — don't wait for the device round-trip.
    if (state) {
      let optimistic = { ...state };
      if (name === 'on') optimistic = { ...optimistic, on: true };
      else if (name === 'off') optimistic = { ...optimistic, on: false, brightness: 0 };
      else if (name === 'toggle') optimistic = { ...optimistic, on: !state.on };
      else if (name === 'brightness') optimistic = { ...optimistic, on: true, brightness: params?.value ?? state.brightness };
      else if (name === 'color') optimistic = { ...optimistic, on: true, color: params };
      else if (name === 'temperature') optimistic = { ...optimistic, on: true, temperature: params?.value ?? state.temperature };
      setState(optimistic);
      dispatchTwinDeviceState(device.id, optimistic, { deviceName: device.name, action: name });
    }
    const next = unwrapState(await iotApi.invokeDevice(device.id, name, params));
    setState(next);
    dispatchTwinDeviceState(device.id, next, { deviceName: device.name, action: name });
    onChanged?.();
    return next;
  };

  if (!state) return <p className="panel-loading">불러오는 중…</p>;

  const displayedBrightness = state.on ? state.brightness : 0;
  const sliderValue = dragBrightness ?? displayedBrightness;

  const commitBrightness = async (value) => {
    setDragBrightness(null);
    if (value <= 0) {
      setState((s) => ({ ...s, on: false, brightness: 0 }));
      await invoke('off', {});
      return;
    }
    setState((s) => ({ ...s, on: true, brightness: value }));
    if (!state.on) await invoke('on', {});
    await invoke('brightness', { value });
  };

  const setColorLocal = (rgb) => setState((s) => ({ ...s, color: rgb }));
  const commitColor = (rgb) => invoke('color', rgb);
  const setPresetColor = (rgb) => {
    setState((s) => ({ ...s, color: rgb }));
    invoke('color', rgb);
  };

  const setColorChannel = (ch, value) => {
    setState((s) => ({ ...s, color: { ...s.color, [ch]: value } }));
  };

  const commitTemperature = async (value) => {
    await invoke('temperature', { value });
  };

  const hex = rgbToHex(state.color);
  const temperature = state.temperature ?? 4000;

  const temperatureBlock = (
    <div className="panel-section">
      <span className="device-panel-label">색온도 {temperature}K</span>
      <TemperatureSlider
        value={temperature}
        onChange={(value) => setState((s) => ({ ...s, temperature: value }))}
        onCommit={commitTemperature}
      />
    </div>
  );

  return (
    <div className="light-panel">
      <PowerToggle on={!!state.on} onToggle={() => invoke('toggle', {})} />

      <div className="panel-section">
        <span className="device-panel-label">밝기 {sliderValue}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setDragBrightness(Number(e.target.value))}
          onMouseUp={(e) => commitBrightness(Number(e.target.value))}
          onTouchEnd={(e) => commitBrightness(Number(e.target.value))}
        />
      </div>

      {isColor ? (
        <>
          {temperatureBlock}
          <div className="panel-section">
            <span className="device-panel-label">색상</span>
            <div className="light-color-section">
              <ColorWheel color={state.color} onChange={setColorLocal} onCommit={commitColor} />
              <div className="light-swatch-grid light-swatch-grid--side" role="list">
                {PRESET_COLORS.map((c, i) => (
                  <button
                    key={`${c.r}-${c.g}-${c.b}-${i}`}
                    type="button"
                    className="light-swatch"
                    style={{ background: `rgb(${c.r}, ${c.g}, ${c.b})` }}
                    onClick={() => setPresetColor(c)}
                    aria-label={`샘플 색상 rgb(${c.r}, ${c.g}, ${c.b})`}
                  />
                ))}
              </div>
              <div className="light-color-meta">
                <strong className="light-color-hex">#{hex}</strong>
                <div className="light-rgb-stack">
                  {['r', 'g', 'b'].map((ch) => (
                    <label className="light-rgb-row" key={ch}>
                      <span>{ch.toUpperCase()}</span>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={state.color?.[ch] ?? 0}
                        onChange={(e) => setColorChannel(ch, Math.max(0, Math.min(255, Number(e.target.value) || 0)))}
                        onBlur={() => invoke('color', state.color)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        temperatureBlock
      )}
    </div>
  );
}
