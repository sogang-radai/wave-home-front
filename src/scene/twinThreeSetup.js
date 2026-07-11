import * as THREE from 'three';

const SUPPRESSED_WARNINGS = new Set([
  'Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.',
]);
const SUPPRESSED_ERRORS = new Set([
  'WebGLRenderer: Context Lost.',
]);

let configured = false;

export function configureTwinThreeRuntime() {
  if (configured) return;
  configured = true;

  const originalWarn = THREE.warn.bind(THREE);
  const originalError = THREE.error.bind(THREE);
  THREE.warn = (message, ...rest) => {
    if (typeof message === 'string') {
      for (const fragment of SUPPRESSED_WARNINGS) {
        if (message.includes(fragment)) return;
      }
    }
    originalWarn(message, ...rest);
  };
  THREE.error = (message, ...rest) => {
    if (typeof message === 'string') {
      for (const fragment of SUPPRESSED_ERRORS) {
        if (message.includes(fragment)) return;
      }
    }
    originalError(message, ...rest);
  };
}

export function applyTwinRendererSettings(gl) {
  if (!gl?.shadowMap) return;
  gl.shadowMap.enabled = false;
  gl.shadowMap.type = THREE.PCFShadowMap;
}

export function createTwinGlRenderer(defaultProps) {
  configureTwinThreeRuntime();
  const gl = new THREE.WebGLRenderer({
    ...defaultProps,
    antialias: true,
    alpha: false,
  });
  applyTwinRendererSettings(gl);
  return gl;
}
