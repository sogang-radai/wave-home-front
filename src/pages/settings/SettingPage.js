import { useState } from 'react';
import './settings.css';
import { DeviceRegistrationSettings, RoomZoneSettings, initialRooms } from './DeviceSettings';
import { SleepSettings } from './SleepSettings';
import { AccountSettings } from './AccountSettings';
import { PersonalSettings } from './PersonalSettings';
import { GeneralSettings } from './GeneralSettings';

const settingCategories = [
  { id: 'devices', label: '기기등록', desc: '입력 장치와 출력 장치를 관리합니다.' },
  { id: 'rooms', label: '방 / 구역 등록', desc: '장치가 배치된 공간을 등록합니다.' },
  { id: 'sleep', label: '수면 설정', desc: '오늘 밤 수면 계획과 자동 제어를 관리합니다.' },
  { id: 'account', label: '계정', desc: '가구 구성원의 프로필을 확인합니다.' },
  { id: 'personal', label: '개인 설정', desc: '내 이름을 변경합니다.' },
  { id: 'general', label: '일반', desc: '테마와 언어를 설정합니다.' },
];

export function SettingPage({ accounts, accountId, account, onSwitchAccount, onRenameAccount, onAddAccount, category, setCategory }) {
  const [rooms, setRooms] = useState(initialRooms);

  return (
    <div className="settings-page">
      <section className="settings-hero card">
        <div className="settings-hero-profile">
          <span className="settings-hero-avatar">{account.name.charAt(0)}</span>
          <div>
            <p className="eyebrow">설정</p>
            <h2 className="settings-hero-name">{account.name}</h2>
          </div>
        </div>
      </section>

      <div className="settings-layout">
        <nav className="settings-nav">
          {settingCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </nav>

        <div className="settings-detail">
          {category === 'devices' && <DeviceRegistrationSettings rooms={rooms} />}
          {category === 'rooms' && <RoomZoneSettings rooms={rooms} setRooms={setRooms} />}
          {category === 'sleep' && <SleepSettings />}
          {category === 'account' && (
            <AccountSettings
              accounts={accounts}
              accountId={accountId}
              onSwitchAccount={onSwitchAccount}
              onAddAccount={onAddAccount}
            />
          )}
          {category === 'personal' && (
            <PersonalSettings key={accountId} account={account} onRenameAccount={onRenameAccount} />
          )}
          {category === 'general' && <GeneralSettings />}
        </div>
      </div>
    </div>
  );
}
