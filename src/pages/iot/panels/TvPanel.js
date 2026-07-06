import { useEffect, useRef, useState } from 'react';
import homeApi from '../../../api/homeApi';
import {
  PowerIcon, InputIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon,
  BackIcon, PlayIcon, HomeIcon,
} from '../icons';

// tizen_tv — power/mute are Toggle, volume is Repeat (hold-to-repeat), channel
// and open_app are one-shot. The D-pad/OK/back/play/home/input buttons map to
// dummy nav_* actions added to deviceClassRegistry purely so the on-screen
// remote is fully interactive — the real device doesn't report state for them.
const APPS = [
  { id: 'netflix', label: 'Netflix', color: '#e50914', abbr: 'N' },
  { id: 'samsung_tv_plus', label: '삼성 TV 플러스', color: '#1428a0', abbr: 'TV+' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', abbr: 'YT' },
  { id: 'prime_video', label: 'Prime Video', color: '#00a8e1', abbr: 'PV' },
];

export function TvPanel({ device, onChanged }) {
  const [state, setState] = useState(null);
  const repeatTimer = useRef(null);

  useEffect(() => {
    homeApi.getDeviceState(device.id).then(setState);
  }, [device.id]);

  const invoke = async (name, params = {}) => {
    const next = await homeApi.invokeDevice(device.id, name, params);
    setState(next);
    onChanged?.();
    return next;
  };

  const startRepeat = (name) => {
    invoke(name);
    repeatTimer.current = setInterval(() => invoke(name), 200);
  };
  const stopRepeat = () => {
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    repeatTimer.current = null;
  };

  useEffect(() => () => stopRepeat(), []);

  if (!state) return <p className="panel-loading">불러오는 중…</p>;

  return (
    <div className="tv-remote">
      <div className="tv-remote-body">
      <div className="tv-remote-row tv-remote-row--top">
        <button type="button" className="tv-remote-btn tv-remote-btn--power" onClick={() => invoke('toggle')} aria-label="전원">
          <PowerIcon width={20} height={20} />
        </button>
        <span className="tv-remote-power-label">{state.on ? '켜짐' : '꺼짐'}</span>
        <button type="button" className="tv-remote-btn" onClick={() => invoke('input_source')} aria-label="외부입력" title="외부입력">
          <InputIcon width={18} height={18} />
        </button>
      </div>

      <div className="tv-dpad">
        <button type="button" className="tv-dpad-btn tv-dpad-btn--up" onClick={() => invoke('nav_up')} aria-label="위로"><ChevronUpIcon width={16} height={16} /></button>
        <button type="button" className="tv-dpad-btn tv-dpad-btn--right" onClick={() => invoke('nav_right')} aria-label="오른쪽"><ChevronRightIcon width={16} height={16} /></button>
        <button type="button" className="tv-dpad-btn tv-dpad-btn--down" onClick={() => invoke('nav_down')} aria-label="아래로"><ChevronDownIcon width={16} height={16} /></button>
        <button type="button" className="tv-dpad-btn tv-dpad-btn--left" onClick={() => invoke('nav_left')} aria-label="왼쪽"><ChevronLeftIcon width={16} height={16} /></button>
        <button type="button" className="tv-dpad-ok" onClick={() => invoke('select')}>OK</button>
      </div>

      <div className="tv-remote-row">
        <button type="button" className="tv-remote-btn" onClick={() => invoke('back')} aria-label="뒤로가기" title="뒤로가기">
          <BackIcon width={18} height={18} />
        </button>
        <button type="button" className="tv-remote-btn" onClick={() => invoke('play_pause')} aria-label="재생" title="재생">
          <PlayIcon width={18} height={18} />
        </button>
      </div>

      <div className="tv-remote-row tv-remote-row--wide">
        <div className="tv-pill-group">
          <button type="button" className="tv-pill-btn" onPointerDown={() => startRepeat('volume_up')} onPointerUp={stopRepeat} onPointerLeave={stopRepeat}>Vol+</button>
          <button type="button" className="tv-pill-btn" onPointerDown={() => startRepeat('volume_down')} onPointerUp={stopRepeat} onPointerLeave={stopRepeat}>Vol−</button>
        </div>
        <button type="button" className="tv-remote-btn" onClick={() => invoke('home')} aria-label="홈" title="홈">
          <HomeIcon width={18} height={18} />
        </button>
        <div className="tv-pill-group">
          <button type="button" className="tv-pill-btn" onClick={() => invoke('channel_up')}>CH+</button>
          <button type="button" className="tv-pill-btn" onClick={() => invoke('channel_down')}>CH−</button>
        </div>
      </div>

      <div className="tv-remote-status">
        <span>볼륨 {state.volume}</span>
        <button type="button" className={`tv-mute-btn${state.muted ? ' active' : ''}`} onClick={() => invoke('mute')}>{state.muted ? '음소거 해제' : '음소거'}</button>
        <span>채널 {state.channel}</span>
      </div>

      <div className="tv-app-diamond">
        {APPS.map((app, i) => (
          <button
            key={app.id}
            type="button"
            className={`tv-app-btn tv-app-btn--${i}${state.app === app.id ? ' active' : ''}`}
            style={{ '--app-color': app.color }}
            onClick={() => invoke('open_app', { app: app.id })}
            aria-label={app.label}
            title={app.label}
          >
            <span>{app.abbr}</span>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
