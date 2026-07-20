import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { deviceDotClass, deviceDotTitle, isDeviceOffline } from './iotUtils';
import { ReconnectIcon } from './icons';
import { DeviceThumb, DeviceDetailBody, detailTabsFor } from './deviceDetail';
import { useIotDevices } from './useIotDevices';

export function IotControlTab() {
  const iot = useIotDevices();
  const {
    rooms, devices, devicesLoading, devicesError,
    roomFilter, setRoomFilter,
    filteredDevices, selectedDevice, selectedDeviceId, selectDevice,
    detailTab, setDetailTab,
    allDeviceRules, deviceEvents,
    reconnectingId, reconnect,
    toast, loadDevices, showToast, onlineCount,
  } = iot;

  const detailTabs = detailTabsFor(selectedDevice);

  return (
    <div className="iot-control-page">
      <Card title="제어·관리" wide>
        <p className="section-description">
          연결된 모든 장치들을 한눈에 보고 <strong className="wave-term">제어</strong>하고 <strong className="wave-term">관리</strong>해요
        </p>

        <div className="iot-control-split">
          <div className="iot-control-pane">
            <div className="iot-control-pane-head">
              <div className="iot-control-pane-head-left">
                <strong>장치 목록</strong>
                {devices.length > 0 && (
                  <span className="iot-online-count">
                    온라인 {onlineCount}/{devices.length}
                  </span>
                )}
              </div>
              <div className="room-filter-pills">
                <button type="button" className={roomFilter === 'all' ? 'active' : ''} onClick={() => setRoomFilter('all')}>전체</button>
                {rooms.map((room) => (
                  <button key={room.id} type="button" className={roomFilter === room.id ? 'active' : ''} onClick={() => setRoomFilter(room.id)}>
                    {room.name}
                  </button>
                ))}
              </div>
            </div>

            {devicesLoading && devices.length === 0 && (
              <p className="panel-loading">장치 목록을 불러오는 중…</p>
            )}
            {devicesError && devices.length === 0 && (
              <p className="panel-empty">{devicesError}</p>
            )}

            <div className="iot-device-grid iot-device-grid--split">
              {filteredDevices.map((device) => {
                const dotClass = deviceDotClass(device);
                const showReconnect = isDeviceOffline(device);
                return (
                  <button
                    key={device.id}
                    type="button"
                    className={`iot-device-card${selectedDeviceId === device.id ? ' selected' : ''}${!device.connected ? ' offline' : ''}`}
                    onClick={() => selectDevice(device)}
                  >
                    <span
                      className={`device-dot ${dotClass}`}
                      title={deviceDotTitle(device)}
                      aria-label={deviceDotTitle(device)}
                    />
                    <DeviceThumb deviceClass={device.class} />
                    <div className="iot-device-card-body">
                      <span className="iot-device-card-room">{device.room?.name || '미지정'}</span>
                      <strong className="iot-device-card-name" title={device.name}>{device.name}</strong>
                    </div>
                    {showReconnect && (
                      <span
                        role="button"
                        tabIndex={0}
                        className={`iot-device-reconnect-btn${reconnectingId === device.id ? ' spinning' : ''}`}
                        onClick={(event) => reconnect(event, device)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') reconnect(event, device);
                        }}
                        aria-label="재연결"
                        title="재연결 시도"
                      >
                        <ReconnectIcon width={16} height={16} />
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredDevices.length === 0 && <p className="panel-empty">이 구역에 등록된 장치가 없습니다.</p>}
            </div>
          </div>

          <div className="iot-control-pane iot-control-pane--detail">
            <div className="iot-control-pane-head">
              <strong>장치 메뉴</strong>
            </div>

            <div className="iot-control-menu-card">
              {selectedDevice ? (
                <>
                <div className="iot-control-detail-head">
                  <div className="iot-control-detail-title">
                    <strong>{selectedDevice.name}</strong>
                    <span>{selectedDevice.classLabel}</span>
                  </div>
                  <div className="iot-control-detail-tabs">
                    <Tabs
                      active={detailTab}
                      onChange={setDetailTab}
                      items={detailTabs}
                      coachMarkPrefix=""
                    />
                  </div>
                </div>
                  <div className="iot-control-detail-body">
                    <DeviceDetailBody
                      device={selectedDevice}
                      detailTab={detailTab}
                      onChanged={loadDevices}
                      showToast={showToast}
                      deviceEvents={deviceEvents}
                      allDeviceRules={allDeviceRules}
                    />
                  </div>
                </>
              ) : (
                <p className="panel-empty iot-control-detail-empty">장치를 선택하면 제어·관리 메뉴가 여기에 표시돼요.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {toast && <div className="iot-toast">{toast}</div>}
    </div>
  );
}
