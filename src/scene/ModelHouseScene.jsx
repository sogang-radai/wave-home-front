import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TWIN_MODEL_URL, TWIN_ROOMS } from '../data/twinSceneConfig';
import {
  applyDeviceVisuals,
  captureRoomMaterialBases,
  fadeWallsToSolid,
  findNodeByName,
  setRoomOpacity,
  updateAirconWind,
  updateFanSpin,
  updateTourWallVisibility,
  updateWallVisibility,
} from '../pages/homeTwin/twinVisuals';
import { hideNodeSubtree } from '../pages/homeTwin/twinCamera';
import { TwinOverviewCamera } from './TwinOverviewCamera';
import { configureTwinThreeRuntime, createTwinGlRenderer, applyTwinRendererSettings } from './twinThreeSetup';

configureTwinThreeRuntime();

const ROOM_FADE_SPEED = 5.5;

function disposeObject3D(root) {
  if (!root) return;
  // Geometries/textures stay shared with the useGLTF cache — only dispose
  // materials we cloned for this scene instance.
  root.traverse((obj) => {
    const materials = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
    materials.forEach((mat) => mat?.dispose?.());
  });
}

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
  const anchorRef = useRef(null);
  const offset = useMemo(() => {
    const [x = 0, y = 0.45, z = 0] = vm.labelOffset || [];
    return new THREE.Vector3(x, y, z);
  }, [vm.labelOffset?.[0], vm.labelOffset?.[1], vm.labelOffset?.[2]]);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    anchorRef.current = findNodeByName(scene, anchorName);
  }, [scene, anchorName]);

  useFrame(() => {
    const anchor = anchorRef.current;
    if (!anchor || !groupRef.current) return;
    anchor.getWorldPosition(groupRef.current.position);
    groupRef.current.position.add(scratch.copy(offset));
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
  cameraTransitioning = false,
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
    captureRoomMaterialBases(next);
    return next;
  }, [scene]);
  const roomRefs = useRef({});
  const roomFadeTarget = useRef({});
  const { camera, gl } = useThree();

  useEffect(() => {
    onSceneReady?.(cloned);
    TWIN_ROOMS.forEach((room) => {
      roomRefs.current[room.gltfRoot] = findNodeByName(cloned, room.gltfRoot);
      roomFadeTarget.current[room.gltfRoot] = 1;
      const group = roomRefs.current[room.gltfRoot];
      if (group) group.userData.twinRoomFade = 1;
    });
    return () => {
      disposeObject3D(cloned);
    };
  }, [cloned, onSceneReady]);

  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas) return undefined;
    const onLost = (event) => {
      // Unmount/navigation often fires this; prevent the noisy default path.
      event.preventDefault();
    };
    canvas.addEventListener('webglcontextlost', onLost, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost, false);
    };
  }, [gl]);

  useEffect(() => {
    hideNodes?.forEach((name) => hideNodeSubtree(cloned, name, true));
  }, [cloned, hideNodes]);

  useEffect(() => {
    TWIN_ROOMS.forEach((room) => {
      const group = roomRefs.current[room.gltfRoot];
      if (!group) return;

      let target = 1;
      if (mode === 'room') {
        target = room.gltfRoot === selectedRoom ? 1 : 0;
      }

      roomFadeTarget.current[room.gltfRoot] = target;
      if (target > 0 || (group.userData.twinRoomFade ?? 1) > 0.01)
        group.visible = true;

      if (mode === 'overview' || mode === 'tour') {
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

    TWIN_ROOMS.forEach((roomDef) => {
      const group = roomRefs.current[roomDef.gltfRoot];
      if (!group) return;
      const target = roomFadeTarget.current[roomDef.gltfRoot] ?? 1;
      const current = group.userData.twinRoomFade ?? 1;
      const next = THREE.MathUtils.damp(current, target, ROOM_FADE_SPEED, delta);
      const settled = Math.abs(next - target) < 0.004;
      const opacity = settled ? target : next;
      group.userData.twinRoomFade = opacity;
      group.visible = opacity > 0.01;

      // Wall-culling modes own material opacity; fade only drives the rest.
      const wallCulled = (mode === 'tour')
        || (mode === 'room' && selectedRoom === roomDef.gltfRoot);
      if (!wallCulled) {
        setRoomOpacity(group, opacity);
      } else if (opacity >= 0.999) {
        group.userData.twinRoomFade = 1;
      }
    });

    if (mode === 'room' && selectedRoom) {
      const room = roomRefs.current[selectedRoom];
      const roomDef = TWIN_ROOMS.find((r) => r.gltfRoot === selectedRoom);
      // Fade only during view-mode camera transitions; orbiting snaps instantly.
      if (room && roomDef) {
        updateWallVisibility(room, roomDef.walls, camera, cameraTransitioning ? delta : 0);
      }
    } else if (mode === 'tour') {
      updateTourWallVisibility(
        TWIN_ROOMS.map((roomDef) => ({
          room: roomRefs.current[roomDef.gltfRoot],
          walls: roomDef.walls,
        })),
        camera,
        cameraTransitioning ? delta : 0,
      );
    } else if (mode === 'overview') {
      // Returning to ceiling: fade previously culled walls back in.
      TWIN_ROOMS.forEach((roomDef) => {
        const room = roomRefs.current[roomDef.gltfRoot];
        if (room) fadeWallsToSolid(room, roomDef.walls, delta);
      });
    }
  });

  const hoverBoxes = TWIN_ROOMS.map((room) => {
    const group = roomRefs.current[room.gltfRoot] || findNodeByName(cloned, room.gltfRoot);
    if (!group || mode !== 'overview' || cameraTransitioning) return null;
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
        showLabels={showLabels && (mode === 'room' || mode === 'tour') && !cameraTransitioning}
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
  const [cameraTransitioning, setCameraTransitioning] = useState(false);
  const showOrthographic = cameraMode === 'ortho';
  const orbitEnabled = (mode === 'room' || mode === 'tour') && !cameraTransitioning;
  const roomOrbitTarget = useMemo(() => {
    if (!sceneRoot || !(mode === 'room' || mode === 'tour')) return [0, 0, 0];
    if (mode === 'tour') {
      const box = new THREE.Box3().setFromObject(sceneRoot);
      if (box.isEmpty()) return [0, 0, 0];
      const center = box.getCenter(new THREE.Vector3());
      const roomSize = box.getSize(new THREE.Vector3());
      return [center.x, box.min.y + roomSize.y * 0.32, center.z];
    }
    if (!selectedRoom) return [0, 0, 0];
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

  const handleCameraTransitionChange = useCallback((active) => {
    setCameraTransitioning(!!active);
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
          <span className="twin-device-tooltip-desc">
            {(tooltip.cardDescription && String(tooltip.cardDescription).trim())
              || (tooltip.connected ? (tooltip.on ? '켜짐' : '대기') : '오프라인')}
          </span>
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
            onTransitionChange={handleCameraTransitionChange}
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
            cameraTransitioning={cameraTransitioning}
            onDeviceHover={(vm) => {
              setTooltip(vm);
              onDeviceHover?.(vm);
            }}
            onSceneReady={handleSceneReady}
          />
        </Suspense>
        {orbitEnabled && (
          <OrbitControls
            target={roomOrbitTarget}
            enablePan={false}
            enableRotate
            enableZoom
            minPolarAngle={THREE.MathUtils.degToRad(10)}
            maxPolarAngle={THREE.MathUtils.degToRad(80)}
            minZoom={mode === 'tour' ? 0.55 : 0.7}
            maxZoom={mode === 'tour' ? 2.4 : 3}
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
