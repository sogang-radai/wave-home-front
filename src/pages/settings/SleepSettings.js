import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';

export const alarmSongs = [
  { id: 'sign-of-the-times', label: 'Sign of the Times – Harry Styles' },
  { id: 'love-yourself', label: 'Love Yourself - Justin Bieber' },
];

function WakeAlarmRow({ title, time, on, onToggle }) {
  return (
    <div className="wake-alarm-row">
      <div>
        <strong>{title}</strong>
        <span>{time}</span>
      </div>
      <button type="button" className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} aria-label={`${title} 토글`}>
        <i />
      </button>
    </div>
  );
}

function getSleepDuration(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export function SleepSettings() {
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [acAuto, setAcAuto] = useState(true);
  const [acTemp, setAcTemp] = useState(25);
  const [lightAuto, setLightAuto] = useState(true);
  const [dimStart, setDimStart] = useState(30);
  const [finalBright, setFinalBright] = useState(10);
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(true);
  const [s3, setS3] = useState(true);
  const [wakeUpSound, setWakeUpSound] = useState(alarmSongs[1].id);

  return (
    <div className="page-stack">
      <Card title="오늘 밤 수면 계획">
        <div className="sleep-settings-time-grid">
          <div className="sleep-settings-time-field">
            <p>취침 시간</p>
            <input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} />
          </div>
          <div className="sleep-settings-time-field">
            <p>기상 시간</p>
            <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
          </div>
        </div>
        <div className="sleep-settings-duration">
          예상 수면 시간: <strong>{getSleepDuration(bedtime, wakeTime)}</strong>
        </div>
        <div className="general-setting-row">
          <div>
            <strong>기상음 설정</strong>
            <span>아침 알람에서 재생할 곡을 선택합니다.</span>
          </div>
          <select value={wakeUpSound} onChange={(event) => setWakeUpSound(event.target.value)}>
            {alarmSongs.map((song) => (
              <option key={song.id} value={song.id}>{song.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="에어컨 자동 온도 조절">
        <div className="general-setting-row">
          <div>
            <strong>자동 온도 조절</strong>
            <span>수면 단계에 따라 최적 온도 유지</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${acAuto ? 'on' : ''}`}
            onClick={() => setAcAuto((value) => !value)}
            aria-label="자동 온도 조절 토글"
          >
            <i />
          </button>
        </div>
        <div className="general-setting-row">
          <strong>목표 온도</strong>
          <Stepper value={acTemp} min={20} max={28} unit="°C" onChange={setAcTemp} />
        </div>
        <div className="stat-trio">
          <div className="stat-trio-item">
            <p>입면 전</p>
            <strong>{acTemp + 1}°C</strong>
          </div>
          <div className="stat-trio-item">
            <p>수면 중</p>
            <strong>{acTemp}°C</strong>
          </div>
          <div className="stat-trio-item">
            <p>기상 전</p>
            <strong>{acTemp + 2}°C</strong>
          </div>
        </div>
      </Card>

      <Card title="입면 조명 자동 조절">
        <div className="general-setting-row">
          <div>
            <strong>조명 자동 조절</strong>
            <span>취침 전 조명을 점진적으로 어둡게</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${lightAuto ? 'on' : ''}`}
            onClick={() => setLightAuto((value) => !value)}
            aria-label="조명 자동 조절 토글"
          >
            <i />
          </button>
        </div>
        {lightAuto && (
          <>
            <div className="general-setting-row">
              <strong>조절 시작 (취침 N분 전)</strong>
              <Stepper value={dimStart} min={10} max={60} step={5} unit="분 전" onChange={setDimStart} />
            </div>
            <div className="general-setting-row">
              <strong>최종 밝기</strong>
              <Stepper value={finalBright} min={0} max={30} step={5} unit="%" onChange={setFinalBright} />
            </div>
            <div className="light-timeline">
              <p>조명 타임라인</p>
              <div className="light-timeline-bars">
                {[100, 80, 60, 40, 20, finalBright].map((b, index) => (
                  <div key={index} className="light-timeline-bar" style={{ height: `${b}%`, opacity: 0.3 + b / 200 }} />
                ))}
              </div>
              <div className="light-timeline-labels">
                <span>현재</span>
                <span>취침 -{dimStart}분</span>
                <span>취침</span>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card title="단계별 기상 알람">
        <div className="wake-alarm-list">
          <WakeAlarmRow
            title="1단계 · 조명 서서히 밝히기"
            time="기상 30분 전"
            on={s1}
            onToggle={() => setS1((value) => !value)}
          />
          <WakeAlarmRow
            title="2단계 · 수면 음악 / 라디오 재생"
            time="기상 15분 전"
            on={s2}
            onToggle={() => setS2((value) => !value)}
          />
          <WakeAlarmRow
            title="3단계 · TV 켜기 / 알람 울리기"
            time="기상 시간"
            on={s3}
            onToggle={() => setS3((value) => !value)}
          />
        </div>
      </Card>
    </div>
  );
}