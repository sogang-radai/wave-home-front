import { useEffect, useState } from 'react';
import './settings.css';
import settingsApi from '../../api/settingsApi';
import { sortRoomsByLocalOrder } from '../../utils/roomOrder';
import { Tabs } from '../../components/ui/Tabs';
import { DeviceRegistrationSettings, RoomZoneSettings } from './DeviceSettings';
import { AccountSettings } from './AccountSettings';
import { GeneralSettings } from './GeneralSettings';
import { AiAgentSettings } from './AiAgentSettings';
import { AboutSettings } from './AboutSettings';
import { SleepSettings } from './SleepSettings';

const settingCategories = [
  { id: 'general', label: '일반', desc: '기본 UI와 시스템 환경' },
  { id: 'account', label: '계정', desc: '구성원 프로필 관리' },
  { id: 'sleep', label: '수면', desc: '수면 목표와 자동화' },
  { id: 'devices', label: '장치', desc: '연결된 장치 관리' },
  { id: 'rooms', label: '구역', desc: '구역과 장치 배치' },
  { id: 'ai', label: 'AI 에이전트', desc: '프롬프트와 AI 모델' },
  { id: 'info', label: '정보', desc: '앱 정보와 약관' },
];

const devCategory = { id: 'dev', label: '개발자', desc: '개발자 전용 도구' };

export function SettingPage({
  accounts,
  accountId,
  account,
  onSwitchAccount,
  onRenameAccount,
  onAddAccount,
  category,
  setCategory,
  showDevSettings = false,
}) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    settingsApi.getRooms().then((list) => setRooms(sortRoomsByLocalOrder(list)));
  }, []);

  const categories = showDevSettings ? [...settingCategories, devCategory] : settingCategories;
  const activeLabel = categories.find((c) => c.id === category)?.label || '';
  const tabItems = categories.map((item) => [item.id, item.label]);

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <nav className="settings-nav settings-nav--cards" aria-label="설정 분류">
          {categories.map((item) => (
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

        <div className="settings-nav-tabs">
          <Tabs active={category} onChange={setCategory} items={tabItems} />
        </div>

        <div className="settings-detail">
          {category === 'general' && <GeneralSettings heading={activeLabel} />}
          {category === 'account' && (
            <AccountSettings
              heading={activeLabel}
              accounts={accounts}
              accountId={accountId}
              account={account}
              onSwitchAccount={onSwitchAccount}
              onRenameAccount={onRenameAccount}
              onAddAccount={onAddAccount}
            />
          )}
          {category === 'devices' && <DeviceRegistrationSettings heading={activeLabel} rooms={rooms} />}
          {category === 'rooms' && <RoomZoneSettings heading={activeLabel} rooms={rooms} setRooms={setRooms} accounts={accounts} />}
          {category === 'ai' && <AiAgentSettings heading={activeLabel} />}
          {category === 'sleep' && <SleepSettings />}
          {category === 'info' && <AboutSettings heading={activeLabel} />}
          {category === 'dev' && showDevSettings && (
            <section className="settings-panel card">
              <h2 className="settings-tab-heading">{activeLabel}</h2>
              <p className="settings-panel-desc">개발자 전용 메뉴입니다. 준비 중입니다.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
