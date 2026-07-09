import { MicIcon, SpeakerMuteIcon, SpeakerOnIcon } from '../icons';

// Live incoming mic level meter. `onToggleMute` is optional — pass it only
// for devices with two-way audio playback (camera); wave_station has no
// speaker to mute, so it renders the bar without the button.
export function MicVolumeBar({ level, muted, onToggleMute, unavailable }) {
  const showDash = unavailable || level == null;
  const pct = showDash ? 0 : Math.round((level ?? 0) * 100);
  return (
    <div className="mic-volume-bar">
      <MicIcon width={16} height={16} />
      <div className="mic-volume-track">
        <div className="mic-volume-fill" style={{ width: showDash ? '0%' : `${pct}%` }} />
      </div>
      <span className="mic-volume-pct">{showDash ? '—' : `${pct}%`}</span>
      {onToggleMute && (
        <button
          type="button"
          className={`mic-mute-btn${muted ? ' muted' : ''}`}
          onClick={onToggleMute}
          aria-label={muted ? '음소거 해제' : '음소거'}
          title={muted ? '음소거 해제' : '음소거'}
        >
          {muted ? <SpeakerMuteIcon width={16} height={16} /> : <SpeakerOnIcon width={16} height={16} />}
        </button>
      )}
    </div>
  );
}
