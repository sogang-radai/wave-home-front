import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { ModelHouseScene } from '../../scene/ModelHouseScene';
import { useTwinDeviceState } from './useTwinDeviceState';
import { useSpeechOverlays } from './useSpeechOverlays';
import { twinRoomByGltfRoot } from '../../data/twinSceneConfig';
import twinIntroMedia from '../../landing/twin_home.png';
import './homeTwin.css';

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
            3D로 구현된 우리 집에서 기기 배치와 상태를 한눈에 확인할 수 있어요. WaveAI 채팅으로
            기기를 제어하면, 그 결과가 여기 트윈 홈에 실시간으로 반영돼요.
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

export function HomeTwinPage({ onOpenChat, chatPopupOpen = false }) {
  const { viewModels } = useTwinDeviceState();
  const speechOverlays = useSpeechOverlays(true);
  const [mode, setMode] = useState('overview');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [showIntro, setShowIntro] = useState(() => !isTwinIntroDismissed());

  const closeIntro = useCallback(() => setShowIntro(false), []);
  const dontShowIntroAgain = useCallback(() => {
    dismissTwinIntroForever();
    setShowIntro(false);
  }, []);
  const openChatFromIntro = useCallback(() => {
    setShowIntro(false);
    onOpenChat?.();
  }, [onOpenChat]);

  const handleRoomSelect = useCallback((gltfRoot) => {
    setSelectedRoom(gltfRoot);
    setMode('room');
  }, []);

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
  }, []);

  const roomLabel = selectedRoom ? twinRoomByGltfRoot(selectedRoom)?.label : null;
  const showLabels = mode === 'room' || mode === 'tour';

  return (
    <div className={`home-twin-page${chatPopupOpen ? ' home-twin-page--chat-open' : ''}`}>
      {showIntro && (
        <TwinIntroPopup
          onClose={closeIntro}
          onDontShowAgain={dontShowIntroAgain}
          onOpenChat={openChatFromIntro}
          onStartTour={startTourFromIntro}
        />
      )}
      {mode === 'overview' && (
        <button type="button" className="twin-back-button" onClick={handleTour} aria-label="둘러보기">
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
  );
}
