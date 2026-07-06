import { useEffect, useRef, useState } from 'react';
import settingsApi from '../../api/settingsApi';
import { NotificationSettings } from './NotificationSettings';
import { SettingsPanel, SettingsSection, SettingsRow } from './SettingsUI';

const generalTabs = [
  { id: 'basic', label: '기본' },
  { id: 'tts', label: '음성' },
  { id: 'notifications', label: '알림' },
];

const themeOptions = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

function SpeakerIcon(props) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function TtsSpeakerSelect({ speakers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = speakers.find((speaker) => speaker.id === value) || speakers[0];

  return (
    <div className="tts-custom-select" ref={ref}>
      <button
        type="button"
        className="tts-custom-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{selected?.name}</span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="tts-custom-dropdown" role="listbox" aria-label="TTS 화자 선택">
          {speakers.map((speaker) => (
            <li
              key={speaker.id}
              role="option"
              aria-selected={speaker.id === value}
              className={`tts-custom-option ${speaker.id === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(speaker.id);
                setOpen(false);
              }}
            >
              <strong>{speaker.name}</strong>
              <span>{speaker.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GeneralSettings({ heading }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [config, setConfig] = useState(null);
  const [ttsSpeakers, setTtsSpeakers] = useState([]);
  const [speedDraft, setSpeedDraft] = useState(null);

  useEffect(() => {
    Promise.all([settingsApi.getGeneralSettings(), settingsApi.getTtsSpeakers()])
      .then(([cfg, speakers]) => {
        setConfig(cfg);
        setTtsSpeakers(speakers);
      });
  }, []);

  const patchConfig = async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const saved = await settingsApi.updateGeneralSettings(next);
    setConfig(saved);
  };

  if (!config) {
    return <SettingsPanel heading={heading} description="테마와 언어, 음성 합성, 알림 등 앱 전반의 기본 동작을 설정합니다." />;
  }

  const displaySpeed = speedDraft !== null ? speedDraft : config.ttsPlaybackSpeed;

  return (
    <SettingsPanel heading={heading} description="테마와 언어, 음성 합성, 알림 등 앱 전반의 기본 동작을 설정합니다.">
      <div className="settings-general-tabs segmented" role="tablist" aria-label="일반 설정 하위 메뉴">
        {generalTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'basic' && (
        <SettingsSection title="화면">
          <SettingsRow label="테마" desc="화면 밝기와 톤을 선택합니다.">
            <div className="segmented">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={config.theme === option.value ? 'active' : ''}
                  onClick={() => patchConfig({ theme: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="언어" desc="앱에서 사용할 언어를 선택합니다.">
            <select
              className="settings-select"
              value={config.language}
              onChange={(event) => patchConfig({ language: event.target.value })}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </SettingsRow>
        </SettingsSection>
      )}

      {activeTab === 'tts' && (
        <SettingsSection title="음성 (TTS)">
          <SettingsRow label="목소리" desc="Supertonic 3 · ko-KR 화자 프리셋">
            <div className="tts-voice-row">
              <TtsSpeakerSelect
                speakers={ttsSpeakers}
                value={config.ttsSpeakerId}
                onChange={(id) => patchConfig({ ttsSpeakerId: id })}
              />
              <button type="button" className="settings-btn-ghost tts-test-btn" title="미리 듣기 (준비 중)">
                <SpeakerIcon />
                테스트
              </button>
            </div>
          </SettingsRow>
          <SettingsRow label="재생 속도" desc="음성 안내가 재생되는 속도입니다.">
            <div className="settings-range-wrap">
              <input
                className="settings-range-input"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={displaySpeed}
                onChange={(event) => setSpeedDraft(Number(event.target.value))}
                onPointerUp={(event) => {
                  const next = Number(event.target.value);
                  setSpeedDraft(null);
                  patchConfig({ ttsPlaybackSpeed: next });
                }}
              />
              <strong className="settings-range-value">{displaySpeed.toFixed(1)}x</strong>
            </div>
          </SettingsRow>
        </SettingsSection>
      )}

      {activeTab === 'notifications' && (
        <NotificationSettings embedded />
      )}
    </SettingsPanel>
  );
}
