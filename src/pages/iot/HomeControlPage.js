import { Tabs } from '../../components/ui/Tabs';
import { IotControlTab } from './IotControlTab';
import { TriggerRulesTab } from './TriggerRulesTab';
import { IrCommandsTab } from './IrCommandsTab';
import { GestureSetsTab } from './GestureSetsTab';
import { EventLogTab } from './EventLogTab';
import './HomeControlPage.css';

const FIXED_HEIGHT_TABS = ['control', 'trigger'];

export function HomeControlPage({ tab, setTab }) {
  return (
    <div className={`page-stack${FIXED_HEIGHT_TABS.includes(tab) ? ' page-stack--fixed' : ''}`}>
      <div className="home-control-tabs-row">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            ['control', '제어·관리'],
            ['trigger', '자동화·예약'],
            ['ir', '적외선 명령'],
            ['gesture', '제스처 목록'],
            ['log', '기록'],
          ]}
        />
      </div>

      {tab === 'control' && <IotControlTab />}
      {tab === 'trigger' && <TriggerRulesTab />}
      {tab === 'ir' && <IrCommandsTab />}
      {tab === 'gesture' && <GestureSetsTab />}
      {tab === 'log' && <EventLogTab />}
    </div>
  );
}
