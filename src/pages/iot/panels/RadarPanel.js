import { useEffect, useMemo, useState } from 'react';
import homeApi from '../../../api/homeApi';

export function RadarPanel({ device }) {
  const [gestureSets, setGestureSets] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [definition, setDefinition] = useState(null);

  useEffect(() => {
    homeApi.getGestureSets().then(setGestureSets);
    homeApi.getRadarGestureSet(device.id).then(setAssignment);
  }, [device.id]);

  useEffect(() => {
    if (assignment?.gestureSetId) {
      homeApi.getGestureSetDefinition(assignment.gestureSetId).then(setDefinition);
    } else {
      setDefinition(null);
    }
  }, [assignment?.gestureSetId]);

  const grouped = useMemo(() => {
    if (!definition) return { state: [], trigger: [] };
    return {
      state: definition.classes.filter((c) => c.kind === 'state'),
      trigger: definition.classes.filter((c) => c.kind === 'trigger'),
    };
  }, [definition]);

  const assign = async (gestureSetId) => {
    const saved = await homeApi.setRadarGestureSet(device.id, gestureSetId || null);
    setAssignment(saved);
  };

  if (!assignment) return <p className="panel-loading">불러오는 중…</p>;

  return (
    <div className="radar-panel">
      <label className="settings-field">
        <span>할당된 제스처 셋</span>
        <select className="settings-select" value={assignment.gestureSetId || ''} onChange={(e) => assign(e.target.value)}>
          <option value="">미지정</option>
          {gestureSets.filter((s) => s.enabled).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      {definition ? (
        <div className="radar-set-summary">
          <p>{definition.description}</p>
          <div className="radar-class-groups">
            {grouped.state.length > 0 && (
              <div>
                <span className="radar-class-group-label">상태 ({grouped.state.length})</span>
                <div className="radar-class-badges">
                  {grouped.state.map((c) => (
                    <span key={c.classId} className="badge state">{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            {grouped.trigger.length > 0 && (
              <div>
                <span className="radar-class-group-label">트리거 ({grouped.trigger.length})</span>
                <div className="radar-class-badges">
                  {grouped.trigger.map((c) => (
                    <span key={c.classId} className="badge trigger">{c.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="panel-empty">제스처 셋이 지정되지 않아 이 레이더는 아직 제스처를 트리거로 사용할 수 없습니다.</p>
      )}
    </div>
  );
}
