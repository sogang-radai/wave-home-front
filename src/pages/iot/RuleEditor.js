// Renders inputs for an action's paramsSchema (a small hand-rolled subset of
// JSON-schema: object/properties/integer/string/enum — enough for this demo).
const PARAM_LABELS = {
  value: '값',
  r: 'R',
  g: 'G',
  b: 'B',
  app: '앱',
  commandId: '적외선 명령',
};

function labelFor(key, prop) {
  const base = PARAM_LABELS[key] || key;
  if (prop?.min !== undefined && prop?.max !== undefined) {
    return `${base} (${prop.min}~${prop.max})`;
  }
  return base;
}

export function ParamsEditor({ schema, values, onChange, irCommands }) {
  if (!schema?.properties) return null;

  const entries = Object.entries(schema.properties);
  const isRgb = entries.some(([k]) => k === 'r') && entries.some(([k]) => k === 'g') && entries.some(([k]) => k === 'b');

  if (isRgb) {
    return (
      <div className="rule-params-rgb">
        {['r', 'g', 'b'].map((key) => {
          const prop = schema.properties[key] || {};
          return (
            <label className="settings-field rule-params-rgb-field" key={key}>
              <span>{labelFor(key, prop)}</span>
              <input
                type="number"
                min={prop.min ?? 0}
                max={prop.max ?? 255}
                value={values[key] ?? ''}
                onChange={(e) => onChange({ ...values, [key]: Number(e.target.value) })}
              />
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rule-params-grid">
      {entries.map(([key, prop]) => {
        if (key === 'commandId') {
          return (
            <label className="settings-field" key={key}>
              <span>{labelFor(key, prop)}</span>
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
              <span>{labelFor(key, prop)}</span>
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
              <span>{labelFor(key, prop)}</span>
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
            <span>{labelFor(key, prop)}</span>
            <input type="text" value={values[key] || ''} onChange={(e) => onChange({ ...values, [key]: e.target.value })} />
          </label>
        );
      })}
    </div>
  );
}

export function actionHasParams(actionDef) {
  return Object.keys(actionDef?.paramsSchema?.properties || {}).length > 0;
}
