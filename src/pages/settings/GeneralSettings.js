import { useState } from 'react';
import { Card } from '../../components/ui/Card';

const alarmSongs = [
  { id: 'sign-of-the-times', label: 'Sign of the Times – Harry Styles' },
  { id: 'love-yourself', label: 'Love Yourself - Justin Bieber' },
];

const ttsSpeakers = [
  { sid: 0, name: '미선', description: '차분하고 안정적인 중저음', character: '침착하고 신뢰감 있는 안내에 어울림', gender: 'female' },
  { sid: 1, name: '하은', description: '밝고 경쾌한 고음', character: '명랑하고 친근한 안내에 어울림', gender: 'female' },
  { sid: 2, name: '서윤', description: '맑고 전문적인 아나운서 톤', character: '공지와 나레이션에 어울림', gender: 'female' },
  { sid: 4, name: '수아', description: '부드럽고 온화한 톤', character: '위로와 휴식 콘텐츠에 어울림', gender: 'female' },
  { sid: 6, name: '민준', description: '깊고 묵직한 저음', character: '공식 안내와 설명에 어울림', gender: 'male' },
  { sid: 9, name: '현우', description: '따뜻하고 포근한 저중음', character: '오디오북과 휴식 안내에 어울림', gender: 'male' },
];

export function GeneralSettings() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ko');
  const [notificationSound, setNotificationSound] = useState(alarmSongs[0].id);
  const [ttsSpeaker, setTtsSpeaker] = useState(0);

  return (
    <Card title="일반">
      <div className="general-setting-row">
        <div>
          <strong>테마</strong>
          <span>화면 밝기와 톤을 선택합니다.</span>
        </div>
        <div className="segmented">
          <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>라이트</button>
          <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>다크</button>
        </div>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>언어</strong>
          <span>앱에서 사용할 언어를 선택합니다.</span>
        </div>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="general-setting-row">
        <div>
          <strong>알림음 설정</strong>
          <span>알림이 울릴 때 재생할 곡을 선택합니다.</span>
        </div>
        <select value={notificationSound} onChange={(event) => setNotificationSound(event.target.value)}>
          {alarmSongs.map((song) => (
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
              key={speaker.sid}
              className={`tts-speaker-card ${ttsSpeaker === speaker.sid ? 'active' : ''}`}
              onClick={() => setTtsSpeaker(speaker.sid)}
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
