import { deviceThumbnails } from '../iot/iotUtils';

// Single-select device picker with thumbnails — same visual idea as
// TriggerDevicePicker (pages/iot/TriggerRulesTab.js) but scoped to the alarm
// domain's own class names so alarm.css stays self-contained.
export function AlarmDevicePicker({ devices, value, onChange }) {
  if (devices.length === 0) {
    return <p className="panel-empty">알람으로 사용할 수 있는 장치가 없습니다.</p>;
  }
  return (
    <div className="alarm-device-list alarm-scroll">
      {devices.map((d) => (
        <button
          key={d.id}
          type="button"
          className={`alarm-device-item${value === d.id ? ' selected' : ''}`}
          onClick={() => onChange(d.id)}
        >
          <span className="alarm-device-thumb" aria-hidden="true">
            {deviceThumbnails[d.class] ? (
              <img src={deviceThumbnails[d.class]} alt="" />
            ) : (
              <span className="alarm-device-thumb-fallback">⌁</span>
            )}
          </span>
          <span className="alarm-device-name">{d.name}</span>
        </button>
      ))}
    </div>
  );
}
