import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { BarChart } from '../components/ui/BarChart';
import { SemiGauge } from '../components/ui/SemiGauge';
import { overviewBanners, energyWeekBars, overviewQuickActions, overviewFeatureTiles } from '../data/overviewData';
import './main.css';

export function OverviewPage({ onNavigate }) {
  const [bannerIndex, setBannerIndex] = useState(0);

  return (
    <div className="page-stack">
      <section className="hero card overview-banner">
        <div>
          <h2>오늘도 좋은 하루예요</h2>
          <p>{overviewBanners[bannerIndex]}</p>
        </div>
        <div className="overview-banner-dots">
          {overviewBanners.map((_, index) => (
            <button
              type="button"
              key={index}
              className={index === bannerIndex ? 'active' : ''}
              aria-label={`메시지 ${index + 1}`}
              onClick={() => setBannerIndex(index)}
            />
          ))}
        </div>
      </section>

      <section className="overview-score-row">
        <Card title="에너지 점수" action="Good">
          <div className="overview-score-number">
            77<small>점</small>
          </div>
          <BarChart data={energyWeekBars} />
        </Card>

        <Card title="활동 링">
          <div className="activity-rings">
            <i className="ring-outer" />
            <i className="ring-mid" />
            <i className="ring-inner" />
          </div>
        </Card>

        <Card title="수면 점수" action="Good" onClick={() => onNavigate('sleep')}>
          <SemiGauge value={75} max={100} label="75점" />
        </Card>
      </section>

      <section className="overview-tile-row">
        <button type="button" className="feature-tile orange" onClick={() => {}}>
          <strong>식사 기록</strong>
          <span>첫 식사를 기록할 준비가 되셨나요?</span>
        </button>

        <div className="overview-quick-grid">
          {overviewQuickActions.map((item) => (
            <button type="button" className={`overview-quick-item ${item.tone}`} key={item.label}>
              {item.label}
            </button>
          ))}
        </div>

        <button type="button" className="feature-tile purple" onClick={() => {}}>
          <strong>심장 건강</strong>
          <span>심장 건강 점수와 주요 인사이트를 한 곳에서 확인하세요.</span>
        </button>
      </section>

      <section className="overview-tile-row">
        {overviewFeatureTiles.map((tile) => (
          <button
            type="button"
            className={`feature-tile ${tile.tone} ${tile.muted ? 'muted' : ''}`}
            key={tile.id}
          >
            <strong>{tile.title}</strong>
            <span>{tile.desc}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
