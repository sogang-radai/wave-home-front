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
import { DeveloperSettings } from './DeveloperSettings';
import { API_MODE } from '../../api/config';

const settingCategories = [
  { id: 'general', label: '일반', desc: '기본 UI와 시스템 환경' },
  { id: 'account', label: '계정', desc: '구성원 프로필 관리' },
  { id: 'devices', label: '장치', desc: '연결된 장치 관리' },
  { id: 'rooms', label: '구역', desc: '구역과 장치 배치' },
  { id: 'ai', label: 'AI 에이전트', desc: '프롬프트와 AI 모델' },
  { id: 'info', label: '정보', desc: '앱 정보와 약관' },
];

const devCategory = { id: 'dev', label: '개발자', desc: '개발자 전용 도구' };
const IS_REAL_API = API_MODE === 'real';

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
  onUnlockDevMenu,
}) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    settingsApi.getRooms().then((list) => setRooms(sortRoomsByLocalOrder(list)));
  }, []);

  const categories = showDevSettings ? [...settingCategories, devCategory] : settingCategories;
  const activeCategory = categories.some((c) => c.id === category) ? category : 'general';
  const activeLabel = categories.find((c) => c.id === activeCategory)?.label || '';
  const tabItems = categories.map((item) => [item.id, item.label]);

  useEffect(() => {
    if (category === 'sleep') setCategory('general');
  }, [category, setCategory]);

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <nav className="settings-nav settings-nav--cards" aria-label="설정 분류">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${activeCategory === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </nav>

        <div className="settings-nav-tabs">
          <Tabs active={activeCategory} onChange={setCategory} items={tabItems} />
        </div>

        <div className="settings-detail">
          {activeCategory === 'general' && <GeneralSettings heading={activeLabel} />}
          {activeCategory === 'account' && (
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
          {activeCategory === 'devices' && <DeviceRegistrationSettings heading={activeLabel} rooms={rooms} />}
          {activeCategory === 'rooms' && <RoomZoneSettings heading={activeLabel} rooms={rooms} setRooms={setRooms} accounts={accounts} />}
          {activeCategory === 'ai' && <AiAgentSettings heading={activeLabel} />}
          {activeCategory === 'info' && (
            <AboutSettings heading={activeLabel} onUnlockDevMenu={onUnlockDevMenu} />
          )}
          {activeCategory === 'dev' && showDevSettings && (
            IS_REAL_API ? (
              <DeveloperSettings heading={activeLabel} />
            ) : (
              <section className="settings-panel card">
                <h2 className="settings-tab-heading">{activeLabel}</h2>
                <p className="settings-panel-desc">개발자 전용 메뉴입니다. 준비 중입니다.</p>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}
