import './maintenance.css';
import maintenanceImage from '../../img/maintenance.png';

export function MaintenancePage() {
  return (
    <div className="maintenance-page">
      <div className="maintenance-card">
        <img
          className="maintenance-image"
          src={maintenanceImage}
          alt="시스템 점검 안내"
        />
        <h1 className="maintenance-title">서비스 안정화를 위한 점검 안내</h1>
        <p className="maintenance-body">
          더 나은 서비스 제공을 위해 현재 시스템 점검을 진행하고 있습니다.
          <br />
          이용에 불편을 드려 죄송하며, 빠른 시일 내에 정비하여 돌아오겠습니다.
        </p>
      </div>
    </div>
  );
}

export default MaintenancePage;
