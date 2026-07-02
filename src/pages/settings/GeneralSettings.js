import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import settingsApi from '../../api/settingsApi';

export function GeneralSettings() {
  const [config, setConfig] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [ttsSpeakers, setTtsSpeakers] = useState([]);

  useEffect(() => {
    settingsApi.getGeneralSettings().then(setConfig);
    settingsApi.getSounds().then(setSounds);
    settingsApi.getTtsSpeakers().then(setTtsSpeakers);
  }, []);

  const patchConfig = async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const saved = await settingsApi.updateGeneralSettings(next);
    setConfig(saved);
  };

  if (!config) return null;

  return (
    <Card title="일반">
      <div className="general-setting-row">
        <div>
          <strong>테마</strong>
          <span>화면 밝기와 톤을 선택합니다.</span>
        </div>
        <div className="segmented">
          <button type="button" className={config.theme === 'light' ? 'active' : ''} onClick={() => patchConfig({ theme: 'light' })}>라이트</button>
          <button type="button" className={config.theme === 'dark' ? 'active' : ''} onClick={() => patchConfig({ theme: 'dark' })}>다크</button>
        </div>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>언어</strong>
          <span>앱에서 사용할 언어를 선택합니다.</span>
        </div>
        <select value={config.language} onChange={(event) => patchConfig({ language: event.target.value })}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>알림음 설정</strong>
          <span>알림이 울릴 때 재생할 곡을 선택합니다.</span>
        </div>
        <select value={config.notificationSound} onChange={(event) => patchConfig({ notificationSound: event.target.value })}>
          {sounds.map((song) => (
            <option key={song.id} value={song.id}>{song.label}</option>
          ))}
        </select>
      </div>

      <div className="tts-setting-block">
        <div className="tts-setting-head">
          <div>
            <strong>TTS 목소리</strong>
            <span>Supertonic 3 · ko-KR 화자 프리셋</span>
          </div>
        </div>
        <div className="tts-speaker-grid">
          {ttsSpeakers.map((speaker) => (
            <button
              type="button"
              key={speaker.id}
              className={`tts-speaker-card ${config.ttsSpeakerId === speaker.id ? 'active' : ''}`}
              onClick={() => patchConfig({ ttsSpeakerId: speaker.id })}
            >
              <strong>{speaker.name}({speaker.gender === 'female' ? '여성' : '남성'})</strong>
              <em>{speaker.description}</em>
              <small>{speaker.character}</small>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
