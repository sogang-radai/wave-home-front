// Renders inputs for an action's paramsSchema (a small hand-rolled subset of
// JSON-schema: object/properties/integer/string/enum — enough for this demo).
// Used by TriggerRulesTab's inline wizard (트리거·예약 통합 자동화 탭).
export function ParamsEditor({ schema, values, onChange, irCommands }) {
  if (!schema?.properties) return null;
  return (
    <div className="rule-params-grid">
      {Object.entries(schema.properties).map(([key, prop]) => {
        if (key === 'commandId') {
          return (
            <label className="settings-field" key={key}>
              <span>적외선 명령</span>
              <select className="settings-select" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })}>
                <option value="">선택</option>
                {irCommands.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          );
        }
        if (prop.enum) {
          return (
            <label className="settings-field" key={key}>
              <span>{key}</span>
              <select className="settings-select" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })}>
                <option value="">선택</option>
                {prop.enum.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          );
        }
        if (prop.type === 'integer') {
          return (
            <label className="settings-field" key={key}>
              <span>{key}{prop.min !== undefined ? ` (${prop.min}~${prop.max})` : ''}</span>
              <input
                type="number"
                min={prop.min}
                max={prop.max}
                value={values[key] ?? ''}
                onChange={(e) => onChange({ ...values, [key]: Number(e.target.value) })}
              />
            </label>
          );
        }
        return (
          <label className="settings-field" key={key}>
            <span>{key}</span>
            <input type="text" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })} />
          </label>
        );
      })}
    </div>
  );
}
