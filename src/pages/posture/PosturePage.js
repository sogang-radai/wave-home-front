import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Donut } from '../../components/ui/Donut';
import { Metric } from '../../components/ui/Metric';
import { InfoList } from '../../components/ui/InfoList';
import { PostureScoreChart } from '../../components/report/PostureScoreChart';
import { InsightCard } from '../../components/report/InsightCard';
import '../../components/report/report.css';
import { PostureDailyReport } from './PostureDailyReport';
import { PostureWeeklyReport } from './PostureWeeklyReport';
import postureApi from '../../api/postureApi';
import sleepApi from '../../api/sleepApi';
import './posture.css';

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

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
  const [today, setToday] = useState(null);
  const [alertSettings, setAlertSettings] = useState(null);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  useEffect(() => {
    postureApi.getToday().then(setToday);
    postureApi.getAlertSettings().then(setAlertSettings);
    postureApi.getDailyInsights().then(setDailyInsights);
    postureApi.getWeeklyInsights().then(setWeeklyInsights);
  }, []);

  const toggleAlert = async (key) => {
    const next = { ...alertSettings, [key]: !alertSettings[key] };
    setAlertSettings(next);
    const saved = await postureApi.updateAlertSettings(next);
    setAlertSettings(saved);
  };

  // Insight approval is a single shared endpoint across sleep/posture/weekly-plan (see sleep.md),
  // so posture insights are approved through sleepApi too — there is no postureApi.updateInsight.
  const toggleInsight = async (id) => {
    const current = [...dailyInsights, ...weeklyInsights].find((item) => item.id === id);
    if (!current) return;
    const nextApproved = !current.approved;
    setDailyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
    setWeeklyInsights((prev) => prev.map((item) => (item.id === id ? { ...item, approved: nextApproved } : item)));
    await sleepApi.updateInsight(id, { approved: nextApproved });
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

      {activeTab === 'current' && today && alertSettings && (
        <div className="dashboard-grid">
          <Card title="현재 자세상태">
            <div className="gesture-placeholder mb-4 rounded-2xl">
              <span>사진 없음</span>
            </div>
            <InfoList
              items={[
                ['현재 감지된 자세', today.current.postureText],
                ['현재 자세 피드백', today.current.feedbackText],
              ]}
            />
          </Card>

          <Card title="오늘의 자세 점수">
            <div className="flex justify-center">
              <Donut pct={today.stats.score / 100} r={48} sw={11}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{today.stats.score}</span>
                  <span className="text-xs" style={{ color: 'var(--sub)' }}>점</span>
                </div>
              </Donut>
            </div>
            <div className="split-stats">
              <Metric label="바른자세" value={`${today.stats.correctPosturePercent}%`} detail={`목표 ${today.stats.correctPostureGoalPercent}%`} />
              <Metric label="알림 수락" value={`${today.stats.alertAcceptRatePercent}%`} detail="전주 대비 개선" />
            </div>
          </Card>

          <Card title="오늘 누적 착석 시간">
            <div className="sitting-time">
              <strong>{formatMinutes(today.stats.totalSittingMinutes)}</strong>
              <span>권장 최대 연속 착석 {today.stats.recommendedMaxContinuousSittingMinutes}분</span>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, Math.round((today.stats.maxContinuousSittingMinutes / today.stats.recommendedMaxContinuousSittingMinutes) * 100))}%`,
                  }}
                />
              </div>
              <p>가장 긴 연속 착석은 {formatMinutes(today.stats.maxContinuousSittingMinutes)}입니다.</p>
            </div>
          </Card>

          <Card title="자세 무너짐 알림" action="ON/OFF">
            <div className="posture-alert-list">
              <PostureAlertRow
                title="거북목"
                desc="목 전방 기울어짐 감지 시 알림"
                on={alertSettings.turtleNeck}
                onToggle={() => toggleAlert('turtleNeck')}
              />
              <PostureAlertRow
                title="허리 기울어짐"
                desc="좌우 기울어짐이 반복될 때 알림"
                on={alertSettings.waistTilt}
                onToggle={() => toggleAlert('waistTilt')}
              />
              <PostureAlertRow
                title="장시간 착석"
                desc="90분 이상 연속 착석 시 휴식 제안"
                on={alertSettings.longSitting}
                onToggle={() => toggleAlert('longSitting')}
              />
            </div>
          </Card>

          <Card title="오늘의 시간대별 자세 점수" wide>
            <p className="mb-3 text-sm" style={{ color: 'var(--sub)' }}>시간대별 자세 점수 변화 (시간 · 점)</p>
            <PostureScoreChart data={today.hourly} xKey="hour" valueKey="score" noteKey="turtleNeckCount" />
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
              {dailyInsights.map((item) => (
                <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} kind={item.kind} title={item.title} text={item.text} onToggle={toggleInsight} />
              ))}
            </div>
          </Card>

          <Card title="WaveAI 추천 주간 권장 액션">
            <div className="posture-action-list">
              {weeklyInsights.map((item) => (
                <InsightCard key={item.id} id={item.id} approved={item.approved} label={item.label} kind={item.kind} title={item.title} text={item.text} onToggle={toggleInsight} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
