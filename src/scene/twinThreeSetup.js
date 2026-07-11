import * as THREE from 'three';

const SUPPRESSED_WARNINGS = new Set([
  'Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.',
]);
const SUPPRESSED_ERROR_FRAGMENTS = [
  'WebGLRenderer: Context Lost',
  'THREE.WebGLRenderer: Context Lost',
];

let configured = false;
let consolePatched = false;

function shouldSuppressErrorMessage(message) {
  if (typeof message !== 'string') return false;
  return SUPPRESSED_ERROR_FRAGMENTS.some((fragment) => message.includes(fragment));
}

export function configureTwinThreeRuntime() {
  if (configured) return;
  configured = true;

  const originalWarn = THREE.warn?.bind(THREE);
  const originalError = THREE.error?.bind(THREE);
  if (originalWarn) {
    try {
      THREE.warn = (message, ...rest) => {
        if (typeof message === 'string') {
          for (const fragment of SUPPRESSED_WARNINGS) {
            if (message.includes(fragment)) return;
          }
        }
        originalWarn(message, ...rest);
      };
    } catch {
      // THREE's module namespace export is read-only in some three.js/bundler
      // combinations (assigning throws instead of silently no-oping) — skip
      // suppression rather than crash the whole scene.
    }
  }
  if (originalError) {
    try {
      THREE.error = (message, ...rest) => {
        if (shouldSuppressErrorMessage(message)) return;
        originalError(message, ...rest);
      };
    } catch {
      // see above
    }
  }

  // Some Three builds log context-loss straight to console.error.
  if (!consolePatched && typeof console !== 'undefined') {
    consolePatched = true;
    const originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      if (args.some((arg) => shouldSuppressErrorMessage(String(arg)))) return;
      originalConsoleError(...args);
    };
  }
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
    powerPreference: 'default',
  });
  applyTwinRendererSettings(gl);

  const canvas = gl.domElement;
  const onContextLost = (event) => {
    // Navigation/unmount tears down the canvas; avoid the default error spam.
    event.preventDefault();
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  const originalDispose = gl.dispose.bind(gl);
  gl.dispose = () => {
    canvas.removeEventListener('webglcontextlost', onContextLost, false);
    originalDispose();
  };

  return gl;
}
