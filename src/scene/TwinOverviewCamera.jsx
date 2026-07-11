import { useLayoutEffect, useMemo, useRef } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  computeTwinOverviewLayout,
  computeTwinRoomLayout,
  computeTwinTourLayout,
} from './twinOverviewLayout';

const TRANSITION_DURATION = 0.95;
const _lookMat = new THREE.Matrix4();
const _endPos = new THREE.Vector3();
const _endTarget = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function quatLookingAt(position, target, out) {
  _lookMat.lookAt(position, target, _up);
  return out.setFromRotationMatrix(_lookMat);
}

function applyOrthoFrustum(camera, layout) {
  camera.left = layout.left;
  camera.right = layout.right;
  camera.top = layout.top;
  camera.bottom = layout.bottom;
  camera.near = layout.near;
  camera.far = layout.far;
  camera.zoom = 1;
}

export function TwinOverviewCamera({
  sceneRoot,
  mode,
  selectedRoom,
  onLayoutReady,
  onTransitionChange,
}) {
  const cameraRef = useRef();
  const { size, invalidate } = useThree();
  const currentTarget = useRef(new THREE.Vector3());
  const desiredLayout = useRef(null);
  const transitioning = useRef(false);
  const transitionT = useRef(0);

  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const startQuat = useRef(new THREE.Quaternion());
  const startFrustum = useRef({ left: -10, right: 10, top: 10, bottom: -10, near: 0.1, far: 200 });
  const endQuat = useRef(new THREE.Quaternion());

  const layout = useMemo(() => {
    if (mode === 'room') {
      return computeTwinRoomLayout(sceneRoot, selectedRoom, size.width, size.height);
    }
    if (mode === 'tour') {
      return computeTwinTourLayout(sceneRoot, size.width, size.height);
    }
    return computeTwinOverviewLayout(sceneRoot, size.width, size.height);
  }, [sceneRoot, mode, selectedRoom, size.width, size.height]);

  useLayoutEffect(() => {
    if (!layout || !cameraRef.current) return;

    const camera = cameraRef.current;
    desiredLayout.current = layout;
    _endPos.fromArray(layout.position);
    _endTarget.copy(layout.target);
    quatLookingAt(_endPos, _endTarget, endQuat.current);

    // First layout only: snap into place.
    if (currentTarget.current.lengthSq() === 0) {
      camera.up.copy(_up);
      camera.position.copy(_endPos);
      applyOrthoFrustum(camera, layout);
      currentTarget.current.copy(_endTarget);
      camera.quaternion.copy(endQuat.current);
      camera.updateProjectionMatrix();
      transitioning.current = false;
      transitionT.current = 1;
      onTransitionChange?.(false);
    } else {
      startPos.current.copy(camera.position);
      startTarget.current.copy(currentTarget.current);
      startQuat.current.copy(camera.quaternion);
      startFrustum.current = {
        left: camera.left,
        right: camera.right,
        top: camera.top,
        bottom: camera.bottom,
        near: camera.near,
        far: camera.far,
      };
      transitioning.current = true;
      transitionT.current = 0;
      onTransitionChange?.(true);
    }

    onLayoutReady?.(true);
    invalidate();
  }, [layout, mode, invalidate, onLayoutReady, onTransitionChange]);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const desired = desiredLayout.current;
    if (!camera || !desired || !transitioning.current) return;

    transitionT.current = Math.min(1, transitionT.current + delta / TRANSITION_DURATION);
    const t = easeInOutCubic(transitionT.current);

    _endPos.fromArray(desired.position);
    _endTarget.copy(desired.target);

    camera.position.lerpVectors(startPos.current, _endPos, t);
    currentTarget.current.lerpVectors(startTarget.current, _endTarget, t);
    camera.quaternion.slerpQuaternions(startQuat.current, endQuat.current, t);
    camera.up.copy(_up);

    const sf = startFrustum.current;
    camera.left = THREE.MathUtils.lerp(sf.left, desired.left, t);
    camera.right = THREE.MathUtils.lerp(sf.right, desired.right, t);
    camera.top = THREE.MathUtils.lerp(sf.top, desired.top, t);
    camera.bottom = THREE.MathUtils.lerp(sf.bottom, desired.bottom, t);
    camera.near = THREE.MathUtils.lerp(sf.near, desired.near, t);
    camera.far = THREE.MathUtils.lerp(sf.far, desired.far, t);
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    if (transitionT.current >= 1) {
      camera.position.copy(_endPos);
      currentTarget.current.copy(_endTarget);
      camera.quaternion.copy(endQuat.current);
      applyOrthoFrustum(camera, desired);
      camera.updateProjectionMatrix();
      transitioning.current = false;
      onTransitionChange?.(false);
    }
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[0, 22, 0.01]}
      left={-10}
      right={10}
      top={10}
      bottom={-10}
      near={0.1}
      far={200}
    />
  );
}
