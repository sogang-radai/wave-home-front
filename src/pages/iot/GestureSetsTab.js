import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import iotApi from '../../api/iotApi';

export function GestureSetsTab() {
  const [sets, setSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [rules, setRules] = useState([]);

  useEffect(() => {
    iotApi.getGestureSets().then((list) => {
      setSets(list);
      const firstWithClasses = list.find((s) => s.classCount > 0) || list[0];
      if (firstWithClasses) setSelectedSetId(firstWithClasses.id);
    });
    iotApi.getRules().then(setRules);
  }, []);

  useEffect(() => {
    if (!selectedSetId) return;
    iotApi.getGestureSetDefinition(selectedSetId).then(setDefinition);
  }, [selectedSetId]);

  const selectedSet = sets.find((s) => s.id === selectedSetId);
  const gestureSetPath = selectedSet?.path || (selectedSetId ? `gestures/${selectedSetId}/set.json` : null);

  const linkedRuleCount = (classId) => rules.filter(
    (r) => r.trigger?.kind === 'gesture'
      && gestureSetPath
      && r.trigger.gestureSetPath === gestureSetPath
      && r.trigger.classId === classId,
  ).length;

  return (
    <div className="gesture-management">
      <div className="gesture-set-list">
        {sets.map((set) => (
          <article className={`gesture-set-card ${selectedSetId === set.id ? 'selected' : ''} ${set.triggerClassCount > 0 ? 'active-set' : ''}`} key={set.id}>
            <button type="button" className="gesture-set-select-button" onClick={() => setSelectedSetId(set.id)} disabled={!set.enabled}>
              <span>{set.enabled ? `${set.classCount}개 클래스` : '미구성'}</span>
              <strong>{set.name}</strong>
              <p>{set.description || '설정 파일이 아직 없습니다.'}</p>
              <small>{set.triggerClassCount}개 트리거 가능</small>
            </button>
          </article>
        ))}
      </div>

      {definition && (
        <Card title={definition.name} wide>
          <p className="section-description">{definition.description}</p>
          <div className="gesture-card-grid">
            {definition.classes.map((c) => {
              const ruleCount = c.kind === 'trigger' ? linkedRuleCount(c.classId) : 0;
              return (
                <article className="gesture-control-card" key={c.classId}>
                  <div className="gesture-thumb-wrap">
                    <img src={c.thumbnail} alt={c.name} />
                  </div>
                  <div className="gesture-card-body">
                    <span className={`status-chip ${c.kind === 'state' ? 'inactive' : 'active'}`}>
                      {c.kind === 'state' ? '상태' : '트리거'}
                    </span>
                    <h3>{c.name}</h3>
                    <p>
                      {c.kind === 'state'
                        ? `유지 ${c.trigger.highHoldMs}ms · 쿨다운 ${c.trigger.cooldownMs}ms`
                        : `홀드 ${c.trigger.highHoldMs}ms · 쿨다운 ${c.trigger.cooldownMs}ms`}
                    </p>
                    {c.kind === 'trigger' && (
                      <span className="rule-link-badge">연결된 룰 {ruleCount}개</span>
                    )}
                  </div>
                </article>
              );
            })}
            {definition.classes.length === 0 && <p className="panel-empty">아직 정의된 클래스가 없습니다.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
