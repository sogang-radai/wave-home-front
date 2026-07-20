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
/** Tilt wind from straight-down toward AC front (-X): 45° forward. */
const WIND_TILT_RAD = -Math.PI / 4;

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
  // bed_ac local: front = -X, down = -Y → rotate around Z so stream goes 45° forward.
  group.rotation.z = WIND_TILT_RAD;
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
    const laneZ = -WIND_SPAN / 2 + ((index + 0.5) / WIND_WISP_COUNT) * WIND_SPAN;
    return {
      line,
      life: 0,
      laneZ,
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
    material.userData.twinOriginalOpacity = material.opacity ?? 1;
  const base = material.userData.twinOriginalOpacity;
  const next = opacity < 1 ? opacity : base;
  material.transparent = next < 0.999;
  material.opacity = next;
  material.depthWrite = next >= 0.95;
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

/** Capture true material opacities once (call right after cloning). */
export function captureRoomMaterialBases(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      if (mat.userData.twinOriginalOpacity === undefined)
        mat.userData.twinOriginalOpacity = mat.opacity ?? 1;
    });
  });
}

/** Wall cull groups are named like bed_px / living_my. */
function isWallCullGroup(obj) {
  return !!obj?.name && /_(px|mx|py|my)$/.test(obj.name);
}

function isUnderWallCullGroup(obj, roomRoot) {
  let node = obj;
  while (node && node !== roomRoot) {
    if (isWallCullGroup(node)) return true;
    node = node.parent;
  }
  return false;
}

/** Room fade mutates wall materials — drop applied cache so cull re-paints. */
function invalidateWallSolidApplied(roomGroup) {
  if (!roomGroup) return;
  roomGroup.traverse((obj) => {
    if (isWallCullGroup(obj)) obj.userData.twinWallSolidApplied = undefined;
  });
}

export function setRoomOpacity(roomGroup, opacity, { skipWallGroups = false } = {}) {
  if (!roomGroup) return;
  const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
  // Skip full mesh traverse when fade has not moved (was a per-frame hitch source).
  if (roomGroup.userData.twinRoomFadeApplied === clamped) {
    roomGroup.userData.twinRoomFade = clamped;
    return;
  }
  roomGroup.userData.twinRoomFade = clamped;
  roomGroup.userData.twinRoomFadeApplied = clamped;
  roomGroup.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    // Wall-cull ownership must keep camera-side walls hidden while the room fades in.
    if (skipWallGroups && isUnderWallCullGroup(obj, roomGroup)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      if (mat.userData.twinOriginalOpacity === undefined)
        mat.userData.twinOriginalOpacity = 1;
      const base = mat.userData.twinOriginalOpacity;
      const next = base * clamped;
      mat.transparent = next < 0.999;
      mat.opacity = next;
      mat.depthWrite = next >= 0.95;
      mat.needsUpdate = true;
    });
  });
  if (!skipWallGroups) invalidateWallSolidApplied(roomGroup);
}

/** Force materials back to their captured base opacity (fade = 1). */
export function restoreRoomOpacity(roomGroup, { skipWallGroups = false } = {}) {
  if (!roomGroup) return;
  roomGroup.userData.twinRoomFade = 1;
  roomGroup.userData.twinRoomFadeApplied = undefined;
  roomGroup.visible = true;
  roomGroup.traverse((obj) => {
    if (skipWallGroups && isUnderWallCullGroup(obj, roomGroup)) return;
    obj.visible = true;
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      const base = mat.userData.twinOriginalOpacity ?? 1;
      mat.userData.twinOriginalOpacity = base;
      mat.transparent = base < 0.999;
      mat.opacity = base;
      mat.depthWrite = base >= 0.95;
      mat.needsUpdate = true;
    });
  });
  if (!skipWallGroups) invalidateWallSolidApplied(roomGroup);
}

const FAN_SPIN_SPEED = -30;
const FAN_SPINDOWN_SEC = 3;

function visualKeyForViewModels(viewModels) {
  return (viewModels || []).map((vm) => [
    vm.deviceId,
    vm.connected ? 1 : 0,
    vm.on ? 1 : 0,
    vm.state?.brightness ?? '',
    vm.state?.temperature ?? '',
    vm.state?.color?.r ?? '',
    vm.state?.color?.g ?? '',
    vm.state?.color?.b ?? '',
  ].join(':')).join('|');
}

export function applyDeviceVisuals(scene, viewModels) {
  if (!scene) return false;
  const nextKey = visualKeyForViewModels(viewModels);
  if (scene.userData.twinVisualKey === nextKey) return false;
  scene.userData.twinVisualKey = nextKey;

  const fanBlades = [];
  const windEmitters = [];
  const pcActivityLeds = [];
  const microwaveShimmers = [];

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
          mat.emissive?.set(vm.on ? 0xffffff : 0x000000);
          mat.emissiveIntensity = vm.on ? 0.85 : 0;
          mat.color?.set(vm.on ? 0xffffff : 0x111111);
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
      const pcLedNames = vm.pcLeds
        ? new Set([vm.pcLeds.power, ...(vm.pcLeds.blink || [])].filter(Boolean))
        : null;
      anchor.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        if (!/led/i.test(obj.name)) return;
        // PC activity LEDs are driven by visibility (show/hide), not emissive alone.
        if (pcLedNames?.has(obj.name)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat.userData.twinBaseEmissive === undefined) {
            mat.userData.twinBaseEmissive = mat.emissive?.clone?.() || new THREE.Color(0x3399ff);
            mat.userData.twinBaseEmissiveIntensity = mat.emissiveIntensity ?? 1;
            mat.userData.twinBaseEmissiveStrength = mat.emissiveIntensity ?? 1;
          }
          if (vm.on && vm.connected) {
            mat.emissive?.copy(mat.userData.twinBaseEmissive);
            mat.emissiveIntensity = Math.max(0.9, mat.userData.twinBaseEmissiveIntensity || 0.9);
          } else {
            mat.emissive?.set(0x000000);
            mat.emissiveIntensity = 0;
          }
          mat.needsUpdate = true;
        });
      });

      if (vm.pcLeds) {
        const active = !!(vm.on && vm.connected);
        const powerLed = findNodeByName(anchor, vm.pcLeds.power) || findNodeByName(scene, vm.pcLeds.power);
        if (powerLed) powerLed.visible = active;

        const blinkNodes = (vm.pcLeds.blink || [])
          .map((name) => findNodeByName(anchor, name) || findNodeByName(scene, name))
          .filter(Boolean);
        blinkNodes.forEach((node) => {
          if (!active) node.visible = false;
        });
        if (active && blinkNodes.length) {
          pcActivityLeds.push({
            leds: blinkNodes.map((node) => ({
              node,
              timer: Math.random() * 0.35,
            })),
          });
        }
      }
    }

    if (vm.kind === 'induction') {
      const glow = vm.glowNode ? findNodeByName(scene, vm.glowNode) : null;
      if (glow) glow.visible = vm.on && vm.connected;
    }

    if (vm.kind === 'microwave') {
      const active = !!(vm.on && vm.connected);
      const screen = vm.glowNode ? findNodeByName(scene, vm.glowNode) : null;
      const digit = vm.digitNode ? findNodeByName(scene, vm.digitNode) : null;
      if (screen) {
        screen.visible = active;
        if (active) {
          screen.traverse((obj) => {
            if (!obj.isMesh || !obj.material) return;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
              if (mat.userData.twinMwBaseEmissive === undefined) {
                mat.userData.twinMwBaseEmissive =
                  mat.emissive?.clone?.() || new THREE.Color(1.0, 0.72, 0.35);
                mat.userData.twinMwBaseEmissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.55);
                if (mat.emissive && mat.emissive.r + mat.emissive.g + mat.emissive.b < 0.05)
                  mat.emissive.copy(mat.userData.twinMwBaseEmissive);
              }
              microwaveShimmers.push({ mat, phase: Math.random() * Math.PI * 2 });
            });
          });
        }
      }
      if (digit) {
        digit.visible = active;
        if (active) {
          digit.traverse((obj) => {
            if (!obj.isMesh || !obj.material) return;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
              if (mat.userData.twinMwDigitEmissive === undefined) {
                mat.userData.twinMwDigitEmissive =
                  mat.emissive?.clone?.() || new THREE.Color(0.05, 0.95, 0.12);
                mat.userData.twinMwDigitEmissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.85);
                if (mat.emissive)
                  mat.emissive.copy(mat.userData.twinMwDigitEmissive);
                mat.emissiveIntensity = mat.userData.twinMwDigitEmissiveIntensity;
              }
            });
          });
        }
      }
    }

    if (vm.kind === 'fan') {
      const blade = vm.bladeNode ? findNodeByName(scene, vm.bladeNode) : null;
      if (blade) {
        fanBlades.push(blade);
        const wantOn = vm.on && vm.connected;
        const speed = blade.userData.twinSpinSpeed ?? 0;
        if (wantOn) {
          blade.userData.twinSpin = true;
          blade.userData.twinSpinSpeed = FAN_SPIN_SPEED;
          blade.userData.twinSpinDecel = 0;
        } else if (blade.userData.twinSpin || Math.abs(speed) > 1e-3) {
          // Constant angular deceleration over FAN_SPINDOWN_SEC.
          if (!blade.userData.twinSpinDecel) {
            const from = blade.userData.twinSpin ? FAN_SPIN_SPEED : speed;
            blade.userData.twinSpinSpeed = from;
            blade.userData.twinSpinDecel = Math.abs(from) / FAN_SPINDOWN_SEC;
          }
          blade.userData.twinSpin = false;
        } else {
          blade.userData.twinSpin = false;
          blade.userData.twinSpinSpeed = 0;
          blade.userData.twinSpinDecel = 0;
        }
      }
    }

    if (vm.wind) {
      const windAnchor = (vm.windNode && findNodeByName(scene, vm.windNode)) || anchor;
      const emitter = ensureWindEmitter(windAnchor);
      emitter.active = vm.on && vm.connected;
      windEmitters.push(emitter);
    }
  });

  scene.userData.twinFanBlades = fanBlades;
  scene.userData.twinWindEmitters = windEmitters;
  scene.userData.twinPcActivityLeds = pcActivityLeds;
  scene.userData.twinMicrowaveShimmers = microwaveShimmers;
  return true;
}

/** Random net/disk-style blink for PC activity LEDs (green/yellow). */
export function updatePcActivityLeds(scene, delta) {
  const sets = scene?.userData?.twinPcActivityLeds;
  if (!sets?.length) return;
  const dt = Math.min(delta, 0.1);
  sets.forEach((set) => {
    set.leds.forEach((led) => {
      led.timer -= dt;
      if (led.timer > 0) return;
      led.node.visible = !led.node.visible;
      if (led.node.visible) {
        // Short lit burst
        led.timer = 0.04 + Math.random() * 0.14;
      } else if (Math.random() < 0.4) {
        // Rapid chatter (still "busy")
        led.timer = 0.03 + Math.random() * 0.09;
      } else {
        // Longer idle gap
        led.timer = 0.12 + Math.random() * 0.55;
      }
    });
  });
}

/** Soft warm shimmer on microwave cavity light when powered on. */
export function updateMicrowaveShimmer(scene, delta) {
  const items = scene?.userData?.twinMicrowaveShimmers;
  if (!items?.length) return;
  const dt = Math.min(delta, 0.1);
  items.forEach((item) => {
    item.phase += dt * 2.4;
    const pulse = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(item.phase));
    const mat = item.mat;
    const base = mat.userData.twinMwBaseEmissiveIntensity || 0.55;
    if (mat.emissive && mat.userData.twinMwBaseEmissive)
      mat.emissive.copy(mat.userData.twinMwBaseEmissive);
    mat.emissiveIntensity = base * pulse;
    mat.needsUpdate = true;
  });
}

function updateFanBlade(obj, delta) {
  const ud = obj.userData;
  if (ud.twinSpin) {
    obj.rotation.x += (ud.twinSpinSpeed || FAN_SPIN_SPEED) * delta;
    return;
  }

  const speed = ud.twinSpinSpeed || 0;
  const decel = ud.twinSpinDecel || 0;
  if (decel <= 0 || Math.abs(speed) <= 1e-4) {
    if (decel > 0) {
      ud.twinSpinSpeed = 0;
      ud.twinSpinDecel = 0;
    }
    return;
  }

  const sign = Math.sign(speed);
  const accel = -sign * decel;
  const nextSpeed = speed + accel * delta;
  if (Math.sign(nextSpeed) !== sign) {
    // Integrate only until stop within this frame.
    const dtStop = Math.abs(speed) / decel;
    obj.rotation.x += speed * dtStop + 0.5 * accel * dtStop * dtStop;
    ud.twinSpinSpeed = 0;
    ud.twinSpinDecel = 0;
    return;
  }

  obj.rotation.x += speed * delta + 0.5 * accel * delta * delta;
  ud.twinSpinSpeed = nextSpeed;
}

export function updateFanSpin(scene, delta) {
  const blades = scene?.userData?.twinFanBlades;
  if (blades?.length) {
    blades.forEach((obj) => updateFanBlade(obj, delta));
    return;
  }
  scene?.traverse((obj) => {
    if (obj.userData.twinSpin !== undefined || obj.userData.twinSpinDecel)
      updateFanBlade(obj, delta);
  });
}

function updateWindEmitter(emitter, delta) {
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
        wisp.laneZ + Math.sin(t * Math.PI * 2 + wisp.seed) * 0.03,
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
      wisp.line.position.set(0, 0, wisp.laneZ);
      wisp.line.material.opacity = 0;
      wisp.line.visible = true;
      wisp.spawnTimer = 0.55 + Math.random() * 1.1;
      anyVisible = true;
    }
  });

  emitter.group.visible = emitter.active || anyVisible;
}

export function updateAirconWind(scene, delta) {
  const emitters = scene?.userData?.twinWindEmitters;
  if (emitters?.length) {
    emitters.forEach((emitter) => updateWindEmitter(emitter, delta));
    return;
  }
  scene?.traverse((obj) => {
    const emitter = obj.userData.twinWindEmitter;
    if (emitter) updateWindEmitter(emitter, delta);
  });
}

const WALL_OUTWARD = {
  px: new THREE.Vector3(1, 0, 0),
  mx: new THREE.Vector3(-1, 0, 0),
  py: new THREE.Vector3(0, 0, -1),
  my: new THREE.Vector3(0, 0, 1),
};

/** Tour mode: outer shell walls that should never be culled. */
export const TOUR_ALWAYS_VISIBLE_WALLS = new Set([
  'bed_px',
  'kitchen_mx',
  'bed_py',
  'living_my',
]);

const WALL_FADE_SPEED = 6.5;
const CAMERA_SIDE_PROP_OPACITY = 0.18;

function applyWallMeshOpacity(obj, factor) {
  if (!obj.isMesh || !obj.material) return;
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  const isWallMesh = obj.name.includes('_wall_');
  // factor 1 = fully solid, 0 = camera-side (wall gone, props ghosted).
  if (isWallMesh) {
    const opacity = factor;
    obj.visible = opacity > 0.02;
    mats.forEach((material) => setMaterialOpacity(material, opacity));
  } else {
    obj.visible = true;
    const opacity = THREE.MathUtils.lerp(CAMERA_SIDE_PROP_OPACITY, 1, factor);
    mats.forEach((material) => setMaterialOpacity(material, opacity));
  }
}

function applyWallCameraSide(wallGroup, isCameraSide, delta = 0) {
  const target = isCameraSide ? 0 : 1;
  let current = wallGroup.userData.twinWallSolid;
  if (current === undefined) current = 1;

  if (delta > 0) {
    current = THREE.MathUtils.damp(current, target, WALL_FADE_SPEED, delta);
    if (Math.abs(current - target) < 0.004) current = target;
  } else {
    current = target;
  }
  if (wallGroup.userData.twinWallSolidApplied === current) {
    wallGroup.userData.twinWallSolid = current;
    return;
  }
  wallGroup.userData.twinWallSolid = current;
  wallGroup.userData.twinWallSolidApplied = current;
  wallGroup.visible = true;
  wallGroup.traverse((obj) => applyWallMeshOpacity(obj, current));
}

/** Fade culled walls back to fully solid (used when returning to ceiling view). */
export function fadeWallsToSolid(room, walls, delta) {
  if (!room || !walls?.length) return false;
  let anyFading = false;
  walls.forEach((wallName) => {
    const wallGroup = findNodeByName(room, wallName);
    if (!wallGroup) return;
    const current = wallGroup.userData.twinWallSolid;
    if (current !== undefined && current < 0.999) anyFading = true;
    // isCameraSide=false → damp toward solid=1
    applyWallCameraSide(wallGroup, false, delta);
  });
  return anyFading;
}

const _wallCamPos = new THREE.Vector3();
const _wallRoomCenter = new THREE.Vector3();
const _wallToCamera = new THREE.Vector3();
const _wallBox = new THREE.Box3();
const _wallWorldOut = new THREE.Vector3();

function wallGroupsFor(room, walls) {
  let cached = room.userData.twinWallGroups;
  if (!cached || cached._walls !== walls) {
    cached = walls.map((wallName) => ({
      wallName,
      group: findNodeByName(room, wallName),
    }));
    cached._walls = walls;
    room.userData.twinWallGroups = cached;
  }
  return cached;
}

function readCullCameraPosition(cameraOrPosition, out) {
  if (!cameraOrPosition) return false;
  if (cameraOrPosition.isCamera) {
    cameraOrPosition.getWorldPosition(out);
    return true;
  }
  if (cameraOrPosition.isVector3) {
    out.copy(cameraOrPosition);
    return true;
  }
  return false;
}

export function updateWallVisibility(room, walls, cameraOrPosition, delta = 0) {
  if (!room || !walls?.length) return;
  if (!readCullCameraPosition(cameraOrPosition, _wallCamPos)) return;

  // Work on a copy — callers may reuse the same world-space vector.
  const camLocal = _wallCamPos;
  room.worldToLocal(camLocal);
  _wallBox.setFromObject(room).getCenter(_wallRoomCenter);
  room.worldToLocal(_wallRoomCenter);
  _wallToCamera.copy(camLocal).sub(_wallRoomCenter).setY(0);
  if (_wallToCamera.lengthSq() < 1e-8) return;
  _wallToCamera.normalize();

  wallGroupsFor(room, walls).forEach(({ wallName, group }) => {
    if (!group) return;
    const suffix = wallName.slice(-2);
    const outward = WALL_OUTWARD[suffix];
    const isCameraSide = outward && outward.dot(_wallToCamera) > 0;
    applyWallCameraSide(group, isCameraSide, delta);
  });
}

/** Clear wall paint cache so the next cull pass rewrites mesh opacity/visibility. */
export function invalidateRoomWallApplied(room, walls) {
  if (!room || !walls?.length) return;
  wallGroupsFor(room, walls).forEach(({ group }) => {
    if (group) group.userData.twinWallSolidApplied = undefined;
  });
}

/**
 * Tour-mode wall culling: one house-wide camera vector so adjacent rooms
 * flip shared-facing walls together. Always-visible walls stay opaque.
 */
export function updateTourWallVisibility(roomEntries, cameraOrPosition, delta = 0) {
  if (!roomEntries?.length) return;
  if (!readCullCameraPosition(cameraOrPosition, _wallCamPos)) return;

  _wallBox.makeEmpty();
  roomEntries.forEach(({ room }) => {
    if (room) _wallBox.expandByObject(room);
  });
  if (_wallBox.isEmpty()) return;

  _wallBox.getCenter(_wallRoomCenter);
  _wallToCamera.copy(_wallCamPos).sub(_wallRoomCenter).setY(0);
  if (_wallToCamera.lengthSq() < 1e-8) return;
  _wallToCamera.normalize();

  roomEntries.forEach(({ room, walls }) => {
    if (!room || !walls?.length) return;
    wallGroupsFor(room, walls).forEach(({ wallName, group }) => {
      if (!group) return;
      if (TOUR_ALWAYS_VISIBLE_WALLS.has(wallName)) {
        applyWallCameraSide(group, false, delta);
        return;
      }
      const suffix = wallName.slice(-2);
      const localOut = WALL_OUTWARD[suffix];
      if (!localOut) return;
      _wallWorldOut.copy(localOut).transformDirection(room.matrixWorld).setY(0);
      if (_wallWorldOut.lengthSq() < 1e-8) return;
      _wallWorldOut.normalize();
      applyWallCameraSide(group, _wallWorldOut.dot(_wallToCamera) > 0, delta);
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
