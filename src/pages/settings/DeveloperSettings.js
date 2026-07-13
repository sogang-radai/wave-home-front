import { useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { GestureDevTab } from './dev/GestureDevTab';
import './dev/developer.css';

const DEV_TABS = [
  ['gesture', '제스처'],
  ['sleep', '수면'],
  ['log', '로그'],
];

export function DeveloperSettings({ heading }) {
  const [tab, setTab] = useState('gesture');

  return (
    <section className="settings-panel card developer-settings">
      <h2 className="settings-tab-heading">{heading}</h2>
      <p className="settings-panel-desc">개발자 전용 디버그 도구입니다.</p>

      <div className="developer-tabs">
        <Tabs active={tab} onChange={setTab} items={DEV_TABS} />
      </div>

      <div className="developer-tab-body">
        {tab === 'gesture' && <GestureDevTab />}
        {tab === 'sleep' && (
          <p className="settings-panel-desc">수면 디버그 탭은 준비 중입니다.</p>
        )}
        {tab === 'log' && (
          <p className="settings-panel-desc">로그 디버그 탭은 준비 중입니다.</p>
        )}
      </div>
    </section>
  );
}
