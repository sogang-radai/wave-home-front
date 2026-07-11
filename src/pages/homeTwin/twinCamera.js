import * as THREE from 'three';
import { getWorldPositionOfNode } from './twinVisuals';
import { LIVING_CAM_NODE } from '../../data/twinSceneConfig';

export function setupLivingCamPov(scene, yawRad = 0, pitchRad = 0, zoom = 0) {
  const lens = scene?.getObjectByName('living_cam_lens_face');
  const cameraNode = scene?.getObjectByName(LIVING_CAM_NODE);
  const pos = lens
    ? lens.getWorldPosition(new THREE.Vector3())
    : getWorldPositionOfNode(scene, LIVING_CAM_NODE);
  if (!pos) return { position: [0, 2, 0], target: [0, 0, 0] };

  const position = pos.clone();
  const worldRotation = cameraNode
    ? cameraNode.getWorldQuaternion(new THREE.Quaternion())
    : new THREE.Quaternion();
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(worldRotation).normalize();
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
  forward.applyAxisAngle(right, pitchRad);
  const target = pos.clone().addScaledVector(forward, 3);
  return {
    position: [position.x, position.y, position.z],
    target: [target.x, target.y, target.z],
    yaw: yawRad,
    pitch: pitchRad,
    fov: THREE.MathUtils.lerp(55, 25, THREE.MathUtils.clamp(zoom, 0, 100) / 100),
  };
}

export function hideNodeSubtree(scene, nodeName, hidden) {
  scene?.traverse((obj) => {
    if (obj.name === nodeName) obj.visible = !hidden;
  });
}
