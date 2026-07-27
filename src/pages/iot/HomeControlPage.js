import { Tabs } from '../../components/ui/Tabs';
import { IotControlTab } from './IotControlTab';
import { TriggerRulesTab } from './TriggerRulesTab';
import { IrCommandsTab } from './IrCommandsTab';
import './HomeControlPage.css';

const FIXED_HEIGHT_TABS = ['control'];

export function HomeControlPage({ tab, setTab }) {
  return (
    <div className={`page-stack${FIXED_HEIGHT_TABS.includes(tab) ? ' page-stack--fixed' : ''}`}>
      <div className="home-control-tabs-row">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            ['trigger', '규칙 설정'],
            ['ir', '리모컨 등록'],
            ['control', '수동 제어'],
          ]}
        />
      </div>

      {tab === 'control' && <IotControlTab />}
      {tab === 'trigger' && <TriggerRulesTab />}
      {tab === 'ir' && <IrCommandsTab />}
    </div>
  );
}
