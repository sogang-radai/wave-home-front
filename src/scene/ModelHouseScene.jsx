import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TWIN_MODEL_URL, TWIN_ROOMS } from '../data/twinSceneConfig';
import {
  applyDeviceVisuals,
  findNodeByName,
  setRoomOpacity,
  updateAirconWind,
  updateFanSpin,
  updateWallVisibility,
} from '../pages/homeTwin/twinVisuals';
import { hideNodeSubtree } from '../pages/homeTwin/twinCamera';
import { TwinOverviewCamera } from './TwinOverviewCamera';
import { configureTwinThreeRuntime, createTwinGlRenderer, applyTwinRendererSettings } from './twinThreeSetup';

configureTwinThreeRuntime();

function DeviceLabel({ vm, onHover }) {
  // 점 색상은 전원 on/off가 아니라 장치가 정상적으로 작동(연결)되고 있는지를 나타낸다.
  const dotClass = vm.connected ? 'twin-dot-on' : 'twin-dot-off';
  return (
    <Html
      center
      style={{ pointerEvents: 'auto' }}
      zIndexRange={[100, 0]}
    >
      <div
        className="twin-device-label"
        onMouseEnter={() => onHover?.(vm)}
        onMouseLeave={() => onHover?.(null)}
      >
        <span className={`twin-status-dot ${dotClass}`} />
        <span>{vm.name}</span>
      </div>
    </Html>
  );
}

function WorldLabelAnchor({ scene, anchorName, vm, onHover }) {
  const groupRef = useRef();
  useFrame(() => {
    const anchor = findNodeByName(scene, anchorName);
    if (!anchor || !groupRef.current) return;
    anchor.getWorldPosition(groupRef.current.position);
    const [x = 0, y = 0.45, z = 0] = vm.labelOffset || [];
    groupRef.current.position.add(new THREE.Vector3(x, y, z));
  });
  return (
    <group ref={groupRef}>
      <DeviceLabel vm={vm} onHover={onHover} />
    </group>
  );
}

function LabelAnchors({ scene, viewModels, selectedRoom, showLabels, onDeviceHover }) {
  if (!scene || !showLabels) return null;
  const devices = selectedRoom
    ? viewModels.filter((vm) => vm.gltfRoot === selectedRoom)
    : viewModels;

  return devices.map((vm) => (
    <WorldLabelAnchor
      key={vm.deviceId}
      scene={scene}
      anchorName={vm.anchor}
      vm={vm}
      onHover={onDeviceHover}
    />
  ));
}

function HouseModel({
  mode,
  selectedRoom,
  hoveredRoom,
  onRoomHover,
  onRoomSelect,
  viewModels,
  hideNodes,
  showLabels,
  onDeviceHover,
  onSceneReady,
}) {
  const { scene } = useGLTF(TWIN_MODEL_URL);
  const cloned = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      obj.material = Array.isArray(obj.material)
        ? obj.material.map((material) => material.clone())
        : obj.material.clone();
    });
    return next;
  }, [scene]);
  const roomRefs = useRef({});
  const { camera } = useThree();

  useEffect(() => {
    onSceneReady?.(cloned);
    TWIN_ROOMS.forEach((room) => {
      roomRefs.current[room.gltfRoot] = findNodeByName(cloned, room.gltfRoot);
    });
  }, [cloned, onSceneReady]);

  useEffect(() => {
    hideNodes?.forEach((name) => hideNodeSubtree(cloned, name, true));
  }, [cloned, hideNodes]);

  useEffect(() => {
    TWIN_ROOMS.forEach((room) => {
      const group = roomRefs.current[room.gltfRoot];
      if (!group) return;
      group.visible = mode === 'overview' || selectedRoom === room.gltfRoot;
      setRoomOpacity(group, 1);

      if (mode === 'overview' || selectedRoom !== room.gltfRoot) {
        room.walls.forEach((wallName) => {
          const wall = findNodeByName(group, wallName);
          wall?.traverse((obj) => {
            obj.visible = true;
          });
        });
      }
    });
  }, [mode, selectedRoom]);

  useEffect(() => {
    applyDeviceVisuals(cloned, viewModels);
  }, [cloned, viewModels]);

  useFrame((_, delta) => {
    updateFanSpin(cloned, delta);
    updateAirconWind(cloned, delta);
    if (mode === 'room' && selectedRoom) {
      const room = roomRefs.current[selectedRoom];
      const roomDef = TWIN_ROOMS.find((r) => r.gltfRoot === selectedRoom);
      if (room && roomDef) updateWallVisibility(room, roomDef.walls, camera);
    }
  });

  const hoverBoxes = TWIN_ROOMS.map((room) => {
    const group = roomRefs.current[room.gltfRoot] || findNodeByName(cloned, room.gltfRoot);
    if (!group || mode !== 'overview') return null;
    const position = room.overlay?.position || [0, 0, 0];
    const overlaySize = room.overlay?.size || [1, 1, 1];
    return (
      <mesh
        key={room.gltfRoot}
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); onRoomHover?.(room.gltfRoot); }}
        onPointerOut={() => onRoomHover?.(null)}
        onClick={(e) => { e.stopPropagation(); onRoomSelect?.(room.gltfRoot); }}
      >
        <boxGeometry args={overlaySize} />
        <meshBasicMaterial
          transparent
          opacity={hoveredRoom === room.gltfRoot ? 0.28 : 0}
          color="#ffffff"
          depthWrite={false}
        />
        <Html center style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
          <span className="twin-overview-room-label">{room.label}</span>
        </Html>
      </mesh>
    );
  });

  return (
    <>
      <primitive object={cloned} />
      {hoverBoxes}
      <LabelAnchors
        scene={cloned}
        viewModels={viewModels}
        selectedRoom={mode === 'room' ? selectedRoom : null}
        showLabels={showLabels && mode === 'room'}
        onDeviceHover={onDeviceHover}
      />
    </>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <hemisphereLight intensity={0.9} color="#ffffff" groundColor="#d8dde5" />
      <directionalLight position={[8, 14, 6]} intensity={1.2} />
    </>
  );
}

function PovCameraController({ config }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    if (!config || !camera.isPerspectiveCamera) return;
    camera.position.fromArray(config.position);
    camera.fov = config.fov || 55;
    camera.lookAt(new THREE.Vector3().fromArray(config.target));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, config, invalidate]);
  return null;
}

export function ModelHouseScene({
  mode = 'overview',
  selectedRoom = null,
  hoveredRoom = null,
  onRoomHover,
  onRoomSelect,
  viewModels = [],
  hideNodes = [],
  showLabels = true,
  onDeviceHover,
  onSceneReady,
  className,
  cameraMode = 'ortho',
  povConfig = null,
  children,
}) {
  const [tooltip, setTooltip] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [overviewLayoutReady, setOverviewLayoutReady] = useState(false);
  const showOrthographic = cameraMode === 'ortho';
  const roomOrbitTarget = useMemo(() => {
    if (!sceneRoot || mode !== 'room' || !selectedRoom) return [0, 0, 0];
    const room = findNodeByName(sceneRoot, selectedRoom);
    if (!room) return [0, 0, 0];
    const box = new THREE.Box3().setFromObject(room);
    const center = box.getCenter(new THREE.Vector3());
    const roomSize = box.getSize(new THREE.Vector3());
    return [center.x, box.min.y + roomSize.y * 0.38, center.z];
  }, [sceneRoot, mode, selectedRoom]);

  useEffect(() => {
    if (!showOrthographic) {
      setOverviewLayoutReady(true);
      return;
    }
    setOverviewLayoutReady(false);
  }, [showOrthographic, sceneRoot]);

  const handleSceneReady = useCallback((scene) => {
    setSceneRoot(scene);
    onSceneReady?.(scene);
  }, [onSceneReady]);

  const handleOverviewLayoutReady = useCallback(() => {
    setOverviewLayoutReady(true);
  }, []);

  const wrapClass = [
    className || 'model-house-scene-wrap',
    showOrthographic && !overviewLayoutReady ? 'model-house-scene-wrap--booting' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClass}>
      {tooltip && (
        <div className="twin-device-tooltip">
          <strong>{tooltip.name}</strong>
          <span>{tooltip.connected ? (tooltip.on ? '켜짐' : '대기') : '오프라인'}</span>
          {tooltip.stateSummary && <small>{tooltip.stateSummary}</small>}
        </div>
      )}
      <Canvas
        flat
        dpr={[1, 1.5]}
        gl={createTwinGlRenderer}
        frameloop={showOrthographic && !overviewLayoutReady ? 'never' : 'always'}
        onCreated={({ gl }) => applyTwinRendererSettings(gl)}
        style={{ display: 'block' }}
      >
        <color attach="background" args={['#ffffff']} />
        <SceneLighting />
        {showOrthographic && (
          <TwinOverviewCamera
            sceneRoot={sceneRoot}
            mode={mode}
            selectedRoom={selectedRoom}
            onLayoutReady={handleOverviewLayoutReady}
          />
        )}
        {cameraMode === 'perspective' && (
          <perspectiveCamera
            makeDefault
            position={povConfig?.position || [5, 8, 5]}
            fov={povConfig?.fov || 55}
            near={0.1}
            far={100}
          />
        )}
        {cameraMode === 'perspective' && povConfig && (
          <PovCameraController config={povConfig} />
        )}
        <Suspense fallback={null}>
          <HouseModel
            mode={mode}
            selectedRoom={selectedRoom}
            hoveredRoom={hoveredRoom}
            onRoomHover={onRoomHover}
            onRoomSelect={onRoomSelect}
            viewModels={viewModels}
            hideNodes={hideNodes}
            showLabels={showLabels}
            onDeviceHover={(vm) => {
              setTooltip(vm);
              onDeviceHover?.(vm);
            }}
            onSceneReady={handleSceneReady}
          />
        </Suspense>
        {mode === 'room' && (
          <OrbitControls
            target={roomOrbitTarget}
            enablePan={false}
            enableRotate
            enableZoom
            minPolarAngle={THREE.MathUtils.degToRad(10)}
            maxPolarAngle={THREE.MathUtils.degToRad(80)}
            minZoom={0.7}
            maxZoom={3}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.ROTATE,
            }}
          />
        )}
        {children}
      </Canvas>
    </div>
  );
}

useGLTF.preload(TWIN_MODEL_URL);
