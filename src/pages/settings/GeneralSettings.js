import { useState } from 'react';
import { Card } from '../../components/ui/Card';

const alarmSongs = [
  { id: 'sign-of-the-times', label: 'Sign of the Times – Harry Styles' },
  { id: 'love-yourself', label: 'Love Yourself - Justin Bieber' },
];

export function GeneralSettings() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ko');
  const [notificationSound, setNotificationSound] = useState(alarmSongs[0].id);

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
    </Card>
  );
}
