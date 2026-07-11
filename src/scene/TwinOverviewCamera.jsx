import { useLayoutEffect, useMemo, useRef } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { computeTwinOverviewLayout, computeTwinRoomLayout } from './twinOverviewLayout';

const tempTarget = new THREE.Vector3();

export function TwinOverviewCamera({
  sceneRoot,
  mode,
  selectedRoom,
  onLayoutReady,
}) {
  const cameraRef = useRef();
  const { size, invalidate } = useThree();
  const currentTarget = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredLayout = useRef(null);
  const transitioning = useRef(false);

  const layout = useMemo(
    () => mode === 'room'
      ? computeTwinRoomLayout(sceneRoot, selectedRoom, size.width, size.height)
      : computeTwinOverviewLayout(sceneRoot, size.width, size.height),
    [sceneRoot, mode, selectedRoom, size.width, size.height],
  );

  useLayoutEffect(() => {
    if (!layout || !cameraRef.current) return;

    desiredLayout.current = layout;
    desiredTarget.current.copy(layout.target);
    if (mode === 'overview' || currentTarget.current.lengthSq() === 0) {
      const camera = cameraRef.current;
      camera.position.fromArray(layout.position);
      camera.left = layout.left;
      camera.right = layout.right;
      camera.top = layout.top;
      camera.bottom = layout.bottom;
      camera.near = layout.near;
      camera.far = layout.far;
      camera.zoom = 1;
      currentTarget.current.copy(layout.target);
      camera.lookAt(currentTarget.current);
      camera.updateProjectionMatrix();
      transitioning.current = false;
    } else {
      transitioning.current = true;
    }

    onLayoutReady?.(true);
    invalidate();
  }, [layout, mode, invalidate, onLayoutReady]);

  useFrame(() => {
    const camera = cameraRef.current;
    const desired = desiredLayout.current;
    if (!camera || !desired || !transitioning.current) return;

    camera.position.lerp(tempTarget.fromArray(desired.position), 0.09);
    currentTarget.current.lerp(desiredTarget.current, 0.09);
    camera.left = THREE.MathUtils.lerp(camera.left, desired.left, 0.09);
    camera.right = THREE.MathUtils.lerp(camera.right, desired.right, 0.09);
    camera.top = THREE.MathUtils.lerp(camera.top, desired.top, 0.09);
    camera.bottom = THREE.MathUtils.lerp(camera.bottom, desired.bottom, 0.09);
    camera.near = desired.near;
    camera.far = desired.far;
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, 1, 0.09);
    camera.lookAt(currentTarget.current);
    camera.updateProjectionMatrix();

    const arrived = camera.position.distanceTo(tempTarget) < 0.02
      && currentTarget.current.distanceTo(desiredTarget.current) < 0.02;
    if (arrived) transitioning.current = false;
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
