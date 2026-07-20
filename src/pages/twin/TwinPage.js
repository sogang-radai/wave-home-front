import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { ModelHouseScene } from '../../scene/ModelHouseScene';
import { useTwinDeviceState } from './useTwinDeviceState';
import { useSpeechOverlays } from './useSpeechOverlays';
import { TWIN_ROOMS, twinRoomByGltfRoot } from '../../data/twinSceneConfig';
import twinIntroMedia from '../../landing/twin_home.png';
import { useIotDevices } from '../iot/useIotDevices';
import { deviceDotClass, deviceDotTitle, isDeviceOffline } from '../iot/iotUtils';
import { Tabs } from '../../components/ui/Tabs';
import { DeviceThumb, DeviceDetailBody, detailTabsFor } from '../iot/deviceDetail';
import { ReconnectIcon } from '../iot/icons';
import './twin.css';

const TWIN_INTRO_DISMISSED_KEY = 'wavehome_twin_intro_dismissed';

function isTwinIntroDismissed() {
  try {
    return localStorage.getItem(TWIN_INTRO_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function dismissTwinIntroForever() {
  try {
    localStorage.setItem(TWIN_INTRO_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

const TWIN_INTRO_EXAMPLE_GROUPS = [
  {
    label: '기기 제어 · 예약',
    examples: [
      '부엌 인덕션 꺼줘',
      '매일 밤 11시에 침실 TV 꺼지게 예약해줘',
      '취침 전에 침실 조명 30분만 따뜻한 색으로 켜줘',
      '이제 자려고 하니까 모든 전등과 전자제품 전원 꺼줘. 30분 뒤에 침실 TV 꺼줘'
    ],
  },
  {
    label: '예약 관리',
    examples: [
      '지금 잡아둔 예약 목록 보여줘',
      '방금 만든 예약 취소해줘',
      '그 자동화 잠깐 꺼둘래',
    ],
  },
  {
    label: '전력 확인',
    examples: [
      '지금 집 전체 전력 얼마나 쓰고 있어?',
      '이번 주 전력 사용량 어때?',
      '에너지 점수 올리려면 뭐부터 하면 돼?',
    ],
  },
];

function TwinIntroPopup({ onClose, onDontShowAgain, onOpenChat, onStartTour }) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="디지털 트윈 홈 사용 안내"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onDontShowAgain}
            className="rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-500 backdrop-blur hover:bg-white hover:text-slate-700"
          >
            다시 보지 않기
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="안내 닫기"
            className="rounded-lg bg-white/80 p-1.5 text-slate-500 backdrop-blur hover:bg-white hover:text-slate-700 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <X size={18} />
          </button>
        </div>

        <img
          src={twinIntroMedia}
          alt="디지털 트윈 홈 미리보기"
          className="hidden w-3/5 shrink-0 bg-slate-50 object-contain sm:block"
        />

        <div className="overflow-y-auto p-7">
          <p className="text-xs font-semibold tracking-wide text-sky-500">디지털 트윈 홈</p>
          <h3 className="mt-1.5 text-xl font-bold text-slate-900">이렇게 사용해보세요</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
            3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인할 수 있어요. 왼쪽 목록에서
            기기를 눌러 직접 제어할 수도 있고, WaveChat 챗봇으로 제어하면 그 결과가 여기 트윈
            홈에 실시간으로 반영돼요.
          </p>

          <div className="mt-5 space-y-4">
            {TWIN_INTRO_EXAMPLE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-slate-400">{group.label}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {group.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      "{example}"
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onStartTour}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              둘러보기
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              채팅으로 제어하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TwinPage({ onOpenChat }) {
  const { viewModels } = useTwinDeviceState();
  const speechOverlays = useSpeechOverlays(true);
  const [mode, setMode] = useState('overview');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [showIntro, setShowIntro] = useState(() => !isTwinIntroDismissed());
  const [showDeviceDetail, setShowDeviceDetail] = useState(false);

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

  const closeIntro = useCallback(() => setShowIntro(false), []);
  const dontShowIntroAgain = useCallback(() => {
    dismissTwinIntroForever();
    setShowIntro(false);
  }, []);
  const openChatFromIntro = useCallback(() => {
    setShowIntro(false);
    onOpenChat?.();
  }, [onOpenChat]);

  // 사이드바 방 필터는 방→방 직행. (예전엔 overview를 한 번 거쳐
  // 방1→전체→방2로 카메라가 두 번 움직였는데, TwinOverviewCamera가
  // selectedRoom 변경을 직접 보간하므로 중간 overview는 필요 없다.
  // 3D 히트박스는 overview에서만 보이므로, 씬에서 방→방 클릭은 여전히
  // 전체 보기를 거친 뒤에만 가능하다.)
  const handleRoomSelect = useCallback((gltfRoot) => {
    setSelectedRoom(gltfRoot);
    setMode('room');
    const room = twinRoomByGltfRoot(gltfRoot);
    if (room) setRoomFilter(room.id);
  }, [setRoomFilter]);

  const handleTour = useCallback(() => {
    setSelectedRoom(null);
    setHoveredRoom(null);
    setMode('tour');
  }, []);

  const startTourFromIntro = useCallback(() => {
    setShowIntro(false);
    handleTour();
  }, [handleTour]);

  const handleBack = useCallback(() => {
    setMode('overview');
    setSelectedRoom(null);
    setHoveredRoom(null);
    setRoomFilter('all');
  }, [setRoomFilter]);

  const selectRoomFilter = (roomId) => {
    setRoomFilter(roomId);

    if (roomId === 'all') {
      setSelectedRoom(null);
      setMode((current) => (current === 'room' ? 'overview' : current));
      return;
    }

    const room = TWIN_ROOMS.find((r) => r.id === roomId);
    if (!room) return;

    setSelectedRoom(room.gltfRoot);
    setMode('room');
  };

  const openDeviceDetail = (device) => {
    selectDevice(device);
    setShowDeviceDetail(true);
  };

  const backToDeviceList = () => setShowDeviceDetail(false);

  const roomLabel = selectedRoom ? twinRoomByGltfRoot(selectedRoom)?.label : null;
  const showLabels = mode === 'room' || mode === 'tour';
  const detailTabs = detailTabsFor(selectedDevice);

  return (
    <div className="home-twin-page">
      {showIntro && (
        <TwinIntroPopup
          onClose={closeIntro}
          onDontShowAgain={dontShowIntroAgain}
          onOpenChat={openChatFromIntro}
          onStartTour={startTourFromIntro}
        />
      )}

      <div className="twin-scene-area">
        {mode === 'overview' && (
          <button type="button" className="twin-back-button" onClick={handleTour} aria-label="둘러보기">
            <SearchIcon />
            <span>둘러보기</span>
          </button>
        )}
        {mode === 'room' && (
          <button type="button" className="twin-back-button" onClick={handleBack} aria-label="전체 보기">
            <BackIcon />
            <span>전체 보기</span>
          </button>
        )}
        {mode === 'tour' && (
          <button type="button" className="twin-back-button" onClick={handleBack} aria-label="돌아가기">
            <BackIcon />
            <span>돌아가기</span>
          </button>
        )}
        {roomLabel && mode === 'room' && (
          <div className="twin-room-title">{roomLabel}</div>
        )}
        <ModelHouseScene
          className="home-twin-canvas"
          mode={mode}
          selectedRoom={selectedRoom}
          hoveredRoom={hoveredRoom}
          onRoomHover={setHoveredRoom}
          onRoomSelect={handleRoomSelect}
          viewModels={viewModels}
          showLabels={showLabels}
          speechOverlays={speechOverlays}
          cameraMode="ortho"
        />
      </div>

      <aside className="twin-device-sidebar">
          {!showDeviceDetail || !selectedDevice ? (
            <>
              <div className="twin-sidebar-head">
                <h3>연결된 기기</h3>
                {devices.length > 0 && (
                  <span className="iot-online-count">
                    <span className="device-dot online" aria-hidden="true" />
                    온라인 {onlineCount}/{devices.length}
                  </span>
                )}
              </div>

              <div className="room-filter-pills">
                <button type="button" className={roomFilter === 'all' ? 'active' : ''} onClick={() => selectRoomFilter('all')}>전체</button>
                {rooms.map((room) => (
                  <button key={room.id} type="button" className={roomFilter === room.id ? 'active' : ''} onClick={() => selectRoomFilter(room.id)}>
                    {room.name}
                  </button>
                ))}
              </div>

              {devicesLoading && devices.length === 0 && (
                <p className="panel-loading">장치 목록을 불러오는 중…</p>
              )}
              {devicesError && devices.length === 0 && (
                <p className="panel-empty">{devicesError}</p>
              )}

              <div className="twin-device-list">
                {filteredDevices.map((device) => {
                  const dotClass = deviceDotClass(device);
                  const showReconnect = isDeviceOffline(device);
                  return (
                    <button
                      key={device.id}
                      type="button"
                      className={`iot-device-card${selectedDeviceId === device.id ? ' selected' : ''}${!device.connected ? ' offline' : ''}`}
                      onClick={() => openDeviceDetail(device)}
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
                {!devicesLoading && filteredDevices.length === 0 && (
                  <p className="panel-empty">이 구역에 등록된 장치가 없습니다.</p>
                )}
              </div>
            </>
          ) : (
            <div className="twin-device-detail">
              <button type="button" className="twin-sidebar-back" onClick={backToDeviceList}>
                <BackIcon />
                <span>목록으로</span>
              </button>

              <div className="twin-device-detail-head">
                <DeviceThumb deviceClass={selectedDevice.class} />
                <div className="twin-device-detail-title">
                  <strong>{selectedDevice.name}</strong>
                  <span>{selectedDevice.classLabel}</span>
                </div>
                <Tabs
                  active={detailTab}
                  onChange={setDetailTab}
                  items={detailTabs}
                  coachMarkPrefix=""
                />
              </div>

              <DeviceDetailBody
                device={selectedDevice}
                detailTab={detailTab}
                onChanged={loadDevices}
                showToast={showToast}
                deviceEvents={deviceEvents}
                allDeviceRules={allDeviceRules}
              />
            </div>
          )}
        </aside>

      {toast && <div className="iot-toast">{toast}</div>}
    </div>
  );
}
