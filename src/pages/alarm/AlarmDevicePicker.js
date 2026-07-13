import logo from '../../img/logo.png';
import { deviceThumbnails } from '../iot/iotUtils';
import { WAVEHOME_DEVICE_CLASS, WAVEHOME_DEVICE_ID } from './alarmUtils';

function DeviceThumb({ device }) {
  if (device.class === WAVEHOME_DEVICE_CLASS || device.id === WAVEHOME_DEVICE_ID) {
    return <img src={logo} alt="" className="alarm-device-thumb-logo" />;
  }
  if (deviceThumbnails[device.class]) {
    return <img src={deviceThumbnails[device.class]} alt="" />;
  }
  return <span className="alarm-device-thumb-fallback">⌁</span>;
}

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
            <DeviceThumb device={d} />
          </span>
          <span className="alarm-device-name">{d.name}</span>
        </button>
      ))}
    </div>
  );
}
