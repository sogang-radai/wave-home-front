import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Donut } from '../../components/ui/Donut';
import { Metric } from '../../components/ui/Metric';
import { InfoList } from '../../components/ui/InfoList';
import { PostureScoreChart } from '../../components/report/PostureScoreChart';
import { InsightCard } from '../../components/report/InsightCard';
import { PostureDailyReport } from './PostureDailyReport';
import { PostureWeeklyReport } from './PostureWeeklyReport';
import { postureBars, postureDailyInsights, postureWeeklyInsights } from '../../data/postureData';
import './posture.css';

function PostureAlertRow({ title, desc, on, onToggle }) {
  return (
    <div className="posture-alert-row">
      <div>
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
      <button type="button" className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} aria-label={`${title} 토글`}>
        <i />
      </button>
    </div>
  );
}

export function PosturePage({ tab, setTab }) {
  const activeTab = tab === 'daily' || tab === 'weekly' ? 'report' : tab;
  const [postureAlerts, setPostureAlerts] = useState({
    turtleNeck: true,
    waistTilt: true,
    longSitting: false,
  });

  const togglePostureAlert = (key) => {
    setPostureAlerts((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="page-stack">
      <Tabs
        active={activeTab}
        onChange={setTab}
        items={[
          ['current', '현재 상태'],
          ['report', '리포트'],
          ['actions', '권장 액션'],
        ]}
      />

      {activeTab === 'current' && (
        <div className="dashboard-grid">
          <Card title="현재 자세상태">
            <div className="gesture-placeholder mb-4 rounded-2xl">
              <span>사진 없음</span>
            </div>
            <InfoList
              items={[
                ['현재 감지된 자세', '목이 앞으로 12도 나옴'],
                ['현재 자세 피드백', '턱을 살짝 당기고 어깨를 뒤로 열어주세요'],
              ]}
            />
          </Card>

          <Card title="오늘의 자세 점수">
            <div className="flex justify-center">
              <Donut pct={0.78} r={48} sw={11}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>78</span>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>점</span>
                </div>
              </Donut>
            </div>
            <div className="split-stats">
              <Metric label="바른자세" value="71%" detail="목표 80%" />
              <Metric label="알림 수락" value="62%" detail="전주 대비 개선" />
            </div>
          </Card>

          <Card title="오늘 누적 착석 시간">
            <div className="sitting-time">
              <strong>5h 20m</strong>
              <span>권장 최대 연속 착석 90분</span>
              <div>
                <i style={{ width: '68%' }} />
              </div>
              <p>가장 긴 연속 착석은 1시간 48분입니다.</p>
            </div>
          </Card>

          <Card title="자세 무너짐 알림" action="ON/OFF">
            <div className="posture-alert-list">
              <PostureAlertRow
                title="거북목"
                desc="목 전방 기울어짐 감지 시 알림"
                on={postureAlerts.turtleNeck}
                onToggle={() => togglePostureAlert('turtleNeck')}
              />
              <PostureAlertRow
                title="허리 기울어짐"
                desc="좌우 기울어짐이 반복될 때 알림"
                on={postureAlerts.waistTilt}
                onToggle={() => togglePostureAlert('waistTilt')}
              />
              <PostureAlertRow
                title="장시간 착석"
                desc="90분 이상 연속 착석 시 휴식 제안"
                on={postureAlerts.longSitting}
                onToggle={() => togglePostureAlert('longSitting')}
              />
            </div>
          </Card>

          <Card title="오늘의 시간대별 자세 점수" wide>
            <p className="mb-3 text-sm" style={{ color: 'var(--sub)' }}>시간대별 자세 점수 변화 (시간 · 점)</p>
            <PostureScoreChart data={postureBars} xKey="label" valueKey="value" noteKey="turtleNeck" />
          </Card>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="posture-report-stack">
          <PostureDailyReport />
          <PostureWeeklyReport />
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="posture-actions-layout">
          <Card title="WaveAI 추천 일간 권장 액션">
            <div className="posture-action-list">
              {postureDailyInsights.map((item) => (
                <InsightCard key={item.id} id={item.id} label={item.label} title={item.title} text={item.text} />
              ))}
            </div>
          </Card>

          <Card title="WaveAI 추천 주간 권장 액션">
            <div className="posture-action-list">
              {postureWeeklyInsights.map((item) => (
                <InsightCard key={item.id} id={item.id} label={item.label} title={item.title} text={item.text} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
