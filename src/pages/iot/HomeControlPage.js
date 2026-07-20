import { Tabs } from '../../components/ui/Tabs';
import { IotControlTab } from './IotControlTab';
import { TriggerRulesTab } from './TriggerRulesTab';
import { IrCommandsTab } from './IrCommandsTab';
import { GestureSetsTab } from './GestureSetsTab';
import { EventLogTab } from './EventLogTab';
import { HomeTwinPage } from '../homeTwin/HomeTwinPage';
import { SHOW_HOME_TWIN } from '../../api/config';
import './HomeControlPage.css';

const FIXED_HEIGHT_TABS = ['twin', 'trigger'];

export function HomeControlPage({ tab, setTab, onOpenChat, chatPopupOpen }) {
  return (
    <div className={`page-stack${FIXED_HEIGHT_TABS.includes(tab) ? ' page-stack--fixed' : ''}`}>
      <div className="home-control-tabs-row">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            SHOW_HOME_TWIN ? ['twin', '디지털 트윈 홈', 'virtual'] : ['control', 'IoT 제어'],
            ['trigger', '자동화 관리'],
            ['ir', '적외선 명령'],
            ['gesture', '제스처 관리'],
            ['log', '로그'],
          ]}
        />
      </div>

      {tab === 'control' && !SHOW_HOME_TWIN && <IotControlTab />}
      {tab === 'twin' && SHOW_HOME_TWIN && (
        <HomeTwinPage onOpenChat={onOpenChat} chatPopupOpen={chatPopupOpen} />
      )}
      {tab === 'trigger' && <TriggerRulesTab />}
      {tab === 'ir' && <IrCommandsTab />}
      {tab === 'gesture' && <GestureSetsTab />}
      {tab === 'log' && <EventLogTab />}
    </div>
  );
}
