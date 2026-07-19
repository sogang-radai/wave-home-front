import { useEffect, useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { Metric } from '../../components/ui/Metric';
import iotApi from '../../api/iotApi';
import { IotControlTab } from './IotControlTab';
import { TriggerRulesTab } from './TriggerRulesTab';
import { IrCommandsTab } from './IrCommandsTab';
import { GestureSetsTab } from './GestureSetsTab';
import { EventLogTab } from './EventLogTab';
import { HomeTwinPage } from '../homeTwin/HomeTwinPage';
import { SHOW_HOME_TWIN } from '../../api/config';
import './HomeControlPage.css';

export function HomeControlPage({ tab, setTab, onOpenChat, chatPopupOpen }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    iotApi.getSummary().then(setSummary);
    // Refresh summary periodically so rule/device changes made in a tab are
    // reflected in the header metrics without a full page reload.
    const timer = setInterval(() => iotApi.getSummary().then(setSummary), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-stack">
      <div className="home-control-tabs-row">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            ...(SHOW_HOME_TWIN ? [['twin', '디지털 트윈 홈', 'virtual']] : []),
            ['control', 'IoT 제어'],
            ['trigger', '트리거'],
            ['ir', '적외선 명령'],
            ['gesture', '제스처 목록'],
            ['log', '로그'],
          ]}
        />
      </div>

      {tab !== 'twin' && (
        <div className="home-summary-grid">
          <Metric
            label="온라인 장치"
            value={summary ? `${summary.onlineDeviceCount}/${summary.totalDeviceCount}` : '—'}
            detail={summary?.devicesStarting ? `초기화 중 (${summary.initializingDeviceCount ?? 0})` : '연결된 기기'}
          />
          <Metric label="오늘 이벤트" value={summary ? `${summary.todayEventCount}건` : '—'} detail="최근 24시간" />
          <Metric label="자동화 규칙" value={summary ? `${summary.activeRuleCount}개` : '—'} detail="트리거 + 예약 자동화 합계" />
        </div>
      )}

      {tab === 'control' && <IotControlTab />}
      {tab === 'trigger' && <TriggerRulesTab />}
      {tab === 'ir' && <IrCommandsTab />}
      {tab === 'gesture' && <GestureSetsTab />}
      {tab === 'log' && <EventLogTab />}
      {tab === 'twin' && SHOW_HOME_TWIN && (
        <HomeTwinPage onOpenChat={onOpenChat} chatPopupOpen={chatPopupOpen} />
      )}
    </div>
  );
}
