import { useCallback, useState } from 'react';
import { ModelHouseScene } from '../../scene/ModelHouseScene';
import { useTwinDeviceState } from './useTwinDeviceState';
import { twinRoomByGltfRoot } from '../../data/twinSceneConfig';
import './homeTwin.css';

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function HomeTwinPage() {
  const { viewModels } = useTwinDeviceState();
  const [mode, setMode] = useState('overview');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  const handleRoomSelect = useCallback((gltfRoot) => {
    setSelectedRoom(gltfRoot);
    setMode('room');
  }, []);

  const handleBack = useCallback(() => {
    setMode('overview');
    setSelectedRoom(null);
    setHoveredRoom(null);
  }, []);

  const roomLabel = selectedRoom ? twinRoomByGltfRoot(selectedRoom)?.label : null;

  return (
    <div className="home-twin-page">
      {mode === 'room' && (
        <button type="button" className="twin-back-button" onClick={handleBack} aria-label="전체 보기">
          <BackIcon />
          <span>전체 보기</span>
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
        showLabels={mode === 'room'}
        cameraMode="ortho"
      />
    </div>
  );
}
