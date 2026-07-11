import * as THREE from 'three';

const WHITE_DEVICE_NODES = new Set([
  'bed_downward_radar',
  'bed_desk_radar',
  'bed_wave_station',
]);

function kelvinToColor(kelvin) {
  const temp = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100;
  let r;
  let g;
  let b;
  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * ((temp - 60) ** -0.1332047592);
    g = 288.1221695283 * ((temp - 60) ** -0.0755148492);
    b = 255;
  }
  return new THREE.Color(
    THREE.MathUtils.clamp(r, 0, 255) / 255,
    THREE.MathUtils.clamp(g, 0, 255) / 255,
    THREE.MathUtils.clamp(b, 0, 255) / 255,
  );
}

function colorForLightState(state) {
  if (state?.color) {
    return new THREE.Color(
      (state.color.r ?? 255) / 255,
      (state.color.g ?? 255) / 255,
      (state.color.b ?? 255) / 255,
    );
  }
  return kelvinToColor(state?.temperature ?? 4000);
}

function ensureFallbackSpotlight(anchor, shade) {
  let light = anchor.userData.twinSpotLight;
  if (light) return light;

  light = new THREE.SpotLight(0xffffff, 0, 10, Math.PI / 6, 0.35, 2);
  const target = new THREE.Object3D();
  light.name = `${anchor.name}_simulated_light`;
  target.name = `${anchor.name}_simulated_light_target`;
  light.position.set(0, 0, 0);
  target.position.set(0, -1, 0);
  light.target = target;
  (shade || anchor).add(light);
  (shade || anchor).add(target);
  anchor.userData.twinSpotLight = light;
  return light;
}

const WIND_WISP_COUNT = 6;
const WIND_WISP_DURATION = 1.3;
const WIND_SPAN = 0.65;

function createWindWispGeometry() {
  const segments = 20;
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    points.push(new THREE.Vector3(
      0,
      -t * 0.34,
      Math.sin(t * Math.PI * 2.4) * 0.05 * (1 - t * 0.3),
    ));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function ensureWindEmitter(anchor) {
  let emitter = anchor.userData.twinWindEmitter;
  if (emitter) return emitter;

  const group = new THREE.Group();
  group.name = `${anchor.name}_wind_emitter`;
  group.visible = false;
  anchor.add(group);

  const wisps = Array.from({ length: WIND_WISP_COUNT }, (_, index) => {
    const line = new THREE.Line(
      createWindWispGeometry(),
      new THREE.LineBasicMaterial({
        color: 0x1a8ec4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    line.visible = false;
    group.add(line);
    const laneX = -WIND_SPAN / 2 + ((index + 0.5) / WIND_WISP_COUNT) * WIND_SPAN;
    return {
      line,
      life: 0,
      laneX,
      seed: Math.random() * Math.PI * 2,
      spawnTimer: Math.random() * 1.2,
    };
  });

  emitter = { group, wisps, active: false };
  anchor.userData.twinWindEmitter = emitter;
  return emitter;
}

function setMaterialOpacity(material, opacity) {
  if (material.userData.twinOriginalOpacity === undefined)
    material.userData.twinOriginalOpacity = material.opacity;
  material.transparent = opacity < 1;
  material.opacity = opacity < 1 ? opacity : material.userData.twinOriginalOpacity;
  material.depthWrite = opacity >= 1;
}

export function findNodeByName(root, name) {
  if (!root) return null;
  if (root.name === name) return root;
  for (const child of root.children || []) {
    const found = findNodeByName(child, name);
    if (found) return found;
  }
  return null;
}

export function setRoomOpacity(roomGroup, opacity) {
  if (!roomGroup) return;
  roomGroup.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      mat.transparent = opacity < 1;
      mat.opacity = opacity;
      mat.depthWrite = opacity >= 0.95;
    });
  });
}

export function applyDeviceVisuals(scene, viewModels) {
  if (!scene) return;
  viewModels.forEach((vm) => {
    const anchor = findNodeByName(scene, vm.anchor);
    if (!anchor) return;

    if (WHITE_DEVICE_NODES.has(vm.anchor)) {
      anchor.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((material) => {
          material.color?.set(0xffffff);
          material.roughness = 0.55;
          material.metalness = 0.05;
        });
      });
    }

    if (vm.kind === 'tv') {
      anchor.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          mat.emissive = new THREE.Color(vm.on ? 0xffffff : 0x000000);
          mat.emissiveIntensity = vm.on ? 0.85 : 0;
          mat.color = new THREE.Color(vm.on ? 0xffffff : 0x111111);
        });
      });
      // 화면 오브젝트는 켜져 있을 때만 표시(꺼지면 본체만 남음).
      if (vm.screenNode) {
        const screen = findNodeByName(scene, vm.screenNode);
        if (screen) screen.visible = vm.on && vm.connected;
      }
    }

    if (vm.kind === 'light') {
      const shade = vm.shadeNode ? findNodeByName(scene, vm.shadeNode) : anchor;
      let modelLight = vm.lightNode ? findNodeByName(scene, vm.lightNode) : null;
      if (!modelLight?.isLight) {
        anchor.traverse((obj) => {
          if (!modelLight?.isLight && obj.isLight) modelLight = obj;
        });
      }
      const light = modelLight?.isLight ? modelLight : ensureFallbackSpotlight(anchor, shade);
      if (light.userData.twinBaseIntensity === undefined)
        light.userData.twinBaseIntensity = modelLight?.isLight ? light.intensity : 45;
      const brightness = THREE.MathUtils.clamp(vm.state?.brightness ?? 100, 0, 100) / 3000;
      light.color.copy(colorForLightState(vm.state));
      light.intensity = vm.on && vm.connected ? light.userData.twinBaseIntensity * brightness : 0;
      light.visible = vm.on && vm.connected;
    }

    if (vm.kind === 'plug') {
      anchor.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        if (!/led/i.test(obj.name)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat.userData.twinBaseEmissive === undefined) {
            mat.userData.twinBaseEmissive = mat.emissive?.clone?.() || new THREE.Color(0x3399ff);
            mat.userData.twinBaseEmissiveIntensity = mat.emissiveIntensity ?? 1;
            mat.userData.twinBaseEmissiveStrength = mat.emissiveIntensity ?? 1;
          }
          if (vm.on && vm.connected) {
            mat.emissive = mat.userData.twinBaseEmissive.clone();
            mat.emissiveIntensity = Math.max(0.9, mat.userData.twinBaseEmissiveIntensity || 0.9);
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
          mat.needsUpdate = true;
        });
      });
    }

    if (vm.kind === 'induction') {
      const glow = vm.glowNode ? findNodeByName(scene, vm.glowNode) : null;
      if (glow) glow.visible = vm.on && vm.connected;
    }

    if (vm.kind === 'fan') {
      const blade = vm.bladeNode ? findNodeByName(scene, vm.bladeNode) : null;
      if (blade) {
        blade.userData.twinSpin = vm.on && vm.connected;
        blade.userData.twinSpinSpeed = -30;
      }
    }

    if (vm.wind) {
      const windAnchor = (vm.windNode && findNodeByName(scene, vm.windNode)) || anchor;
      const emitter = ensureWindEmitter(windAnchor);
      emitter.active = vm.on && vm.connected;
    }
  });
}

export function updateFanSpin(scene, delta) {
  scene?.traverse((obj) => {
    if (obj.userData.twinSpin) {
      obj.rotation.x += (obj.userData.twinSpinSpeed || -30) * delta;
    }
  });
}

export function updateAirconWind(scene, delta) {
  scene?.traverse((obj) => {
    const emitter = obj.userData.twinWindEmitter;
    if (!emitter) return;

    let anyVisible = false;
    emitter.wisps.forEach((wisp) => {
      if (wisp.life > 0) {
        wisp.life = Math.max(0, wisp.life - delta);
        const t = 1 - wisp.life / WIND_WISP_DURATION;
        const fadeIn = Math.min(t / 0.25, 1);
        const fadeOut = Math.min((1 - t) / 0.35, 1);
        wisp.line.material.opacity = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.95;
        wisp.line.position.set(
          0,
          -t * 0.42,
          wisp.laneX + Math.sin(t * Math.PI * 2 + wisp.seed) * 0.03,
        );
        wisp.line.scale.setScalar(0.7 + t * 0.5);
        wisp.line.visible = wisp.line.material.opacity > 0.01;
        if (wisp.line.visible) anyVisible = true;
      }

      if (!emitter.active) return;

      wisp.spawnTimer -= delta;
      if (wisp.life <= 0 && wisp.spawnTimer <= 0) {
        wisp.life = WIND_WISP_DURATION;
        wisp.seed = Math.random() * Math.PI * 2;
        wisp.line.position.set(wisp.laneX, 0, 0);
        wisp.line.material.opacity = 0;
        wisp.line.visible = true;
        wisp.spawnTimer = 0.55 + Math.random() * 1.1;
        anyVisible = true;
      }
    });

    emitter.group.visible = emitter.active || anyVisible;
  });
}

export function updateWallVisibility(room, walls, camera) {
  if (!room || !camera || !walls?.length) return;

  const cameraLocal = room.worldToLocal(camera.getWorldPosition(new THREE.Vector3()));
  const roomCenter = new THREE.Box3().setFromObject(room).getCenter(new THREE.Vector3());
  room.worldToLocal(roomCenter);
  const toCamera = cameraLocal.sub(roomCenter).setY(0).normalize();
  const wallDirections = {
    px: new THREE.Vector3(1, 0, 0),
    mx: new THREE.Vector3(-1, 0, 0),
    py: new THREE.Vector3(0, 0, -1),
    my: new THREE.Vector3(0, 0, 1),
  };

  walls.forEach((wallName) => {
    const wallGroup = findNodeByName(room, wallName);
    if (!wallGroup) return;
    const suffix = wallName.slice(-2);
    const outward = wallDirections[suffix];
    const isCameraSide = outward && outward.dot(toCamera) > 0;

    wallGroup.visible = true;
    wallGroup.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const isWallMesh = obj.name.includes('_wall_');
      obj.visible = !(isCameraSide && isWallMesh);
      const opacity = isCameraSide && !isWallMesh ? 0.18 : 1;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => setMaterialOpacity(material, opacity));
    });
  });
}

export function getWorldPositionOfNode(scene, nodeName) {
  const node = findNodeByName(scene, nodeName);
  if (!node) return null;
  const pos = new THREE.Vector3();
  node.getWorldPosition(pos);
  return pos;
}
