import * as THREE from 'three';

export function computeTwinOverviewLayout(sceneRoot, width, height) {
  if (!sceneRoot || width < 2 || height < 2) return null;

  sceneRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(sceneRoot);
  if (box.isEmpty()) return null;

  const center = box.getCenter(new THREE.Vector3());
  const boxSize = box.getSize(new THREE.Vector3());
  const aspect = width / height;
  const padding = 1.18;
  const halfH = Math.max(boxSize.z * 0.5, boxSize.x / aspect * 0.5) * padding;
  const halfW = halfH * aspect;

  return {
    left: -halfW,
    right: halfW,
    top: halfH,
    bottom: -halfH,
    near: 0.1,
    far: Math.max(boxSize.y + 40, 80),
    position: [
      center.x,
      box.max.y + Math.max(boxSize.y, 6) * 1.15,
      center.z + 0.01,
    ],
    target: center,
  };
}

export function computeTwinRoomLayout(sceneRoot, roomName, width, height) {
  if (!sceneRoot || !roomName || width < 2 || height < 2) return null;

  const room = sceneRoot.getObjectByName(roomName);
  if (!room) return null;

  sceneRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(room);
  if (box.isEmpty()) return null;

  const center = box.getCenter(new THREE.Vector3());
  const boxSize = box.getSize(new THREE.Vector3());
  const target = new THREE.Vector3(
    center.x,
    box.min.y + boxSize.y * 0.38,
    center.z,
  );
  const direction = new THREE.Vector3(1, 1.15, 1).normalize();
  const distance = Math.max(boxSize.x, boxSize.z, 4) * 1.8;
  const aspect = width / height;
  const projectedHeight = Math.max(
    boxSize.y * 1.15,
    boxSize.z * 0.72,
    boxSize.x / aspect * 0.72,
  );
  const halfH = Math.max(projectedHeight * 1.24, 4.4);
  const halfW = halfH * aspect;

  return {
    left: -halfW,
    right: halfW,
    top: halfH,
    bottom: -halfH,
    near: 0.1,
    far: Math.max(distance * 4, 80),
    position: target.clone().addScaledVector(direction, distance).toArray(),
    target,
  };
}
