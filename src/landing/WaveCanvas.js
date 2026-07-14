import { useEffect, useRef } from "react";

// Fully procedural ocean. There is no source video anymore: the water is
// generated in the fragment shader, so it stays sharp at any resolution and
// the old watermark-crop hack (videoTopCrop) is gone with it.
const CONFIG = {
  // Interactive ripple sim (unchanged behaviour).
  simScale: 0.24,
  damping: 0.988,
  waveEvery: 2,
  brushRadius: 7,
  swellAmp: 2,
  swellSpeed: 55,
  refraction: 1.3,
  specular: 0.14,
  strokeForce: 2,

  // Procedural water.
  waterScale: 2.6, // higher = smaller caustic cells
  flowSpeed: 0.6, // overall drift/animation rate (was playbackRate)
  foam: 0.55, // 0 disables the white foam breakup
  glint: 0.1, // sun sparkle intensity

  // Render resolution multiplier. The shader is fill-rate heavy; drop to
  // ~0.75 if you need headroom on low-end GPUs.
  renderScale: 1,
  maxDpr: 1.75,
};

const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uHeight;
uniform vec2  uSim;
uniform vec2  uAspect;
uniform float uTime;
uniform float uRefr;
uniform float uSpec;
uniform float uScale;
uniform float uFoam;
uniform float uGlint;
out vec4 frag;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);

// 3-octave: cheap, used for the domain-warp offsets.
float fbm3(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++){ v += a * noise(p); p = ROT * p; a *= 0.5; }
  return v;
}

// 4-octave: the surface itself.
float fbm4(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = ROT * p; a *= 0.5; }
  return v;
}

vec3 ocean(vec2 uv, float t){
  vec2 p = uv * uAspect * uScale;
  p += vec2(t * 0.020, -t * 0.035);

  // Two rounds of domain warping: this is what turns plain noise into the
  // rounded, interlocking caustic cells you get on shallow water.
  vec2 q = vec2(
    fbm3(p + t * 0.05),
    fbm3(p + vec2(5.2, 1.3) - t * 0.04)
  );
  vec2 r = vec2(
    fbm3(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.09),
    fbm3(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.07)
  );
  float f = fbm4(p + 3.0 * r);

  // Large, slow depth variation so the field never reads as a flat tile.
  float depth = fbm3(p * 0.32 - t * 0.012);

  vec3 deep    = vec3(0.02, 0.24, 0.36);
  vec3 mid     = vec3(0.08, 0.44, 0.53);
  vec3 shallow = vec3(0.18, 0.35, 0.42);

  vec3 col = mix(deep, mid, smoothstep(0.20, 0.62, f));
  col = mix(col, shallow, smoothstep(0.60, 0.95, f));
  col = mix(col, deep * 0.72, smoothstep(0.58, 0.14, depth) * 0.38);

  // Bright rims where cells meet.
  float web = clamp(1.0 - abs(f - 0.52) * 3.2, 0.0, 1.0);
  col += pow(web, 3.0) * 0.22 * vec3(0.42, 0.66, 0.72);

  // Sun glints: sparse because of the high exponent.
  float g = pow(fbm3(p * 4.0 + t * 0.45), 6.0);
  col += g * uGlint * vec3(1.0, 1.0, 0.98);

  // Foam breaking on the brightest crests.
  float foam = smoothstep(0.76, 0.96, f) * smoothstep(0.35, 0.82, noise(p * 7.0 + t * 0.30));
  col = mix(col, vec3(0.72, 0.84, 0.90), foam * uFoam);

  return col;
}

void main(){
  vec2 t = 1.0 / uSim;

  float hl = texture(uHeight, vUv - vec2(t.x, 0.0)).r;
  float hr = texture(uHeight, vUv + vec2(t.x, 0.0)).r;
  float hu = texture(uHeight, vUv - vec2(0.0, t.y)).r;
  float hd = texture(uHeight, vUv + vec2(0.0, t.y)).r;
  float gx = hl - hr;
  float gy = hu - hd;

  // Refraction: the ripple field displaces where we evaluate the water.
  vec2 uv = vUv + vec2(gx, gy) * uRefr * t;
  vec3 col = ocean(uv, uTime);

  float light = (gx * 0.7 - gy * 0.7) * uSpec / 255.0;
  col += max(light, 0.0) * vec3(0.62, 0.78, 0.88);
  col += min(light, 0.0) * vec3(0.30, 0.20, 0.10);

  frag = vec4(col, 1.0);
}`;

export default function WaveCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const WATER_FALLBACK =
      "linear-gradient(160deg, #94e4ea 0%, #2aa7c0 45%, #0a5478 100%)";

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });

    // No WebGL2: a static gradient in the water's own palette. Nothing else
    // to fall back to now that the video is gone.
    if (!gl) {
      canvas.style.display = "none";
      container.style.background = WATER_FALLBACK;
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function compile(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile error");
      }
      return shader;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uniformNames = [
      "uHeight", "uSim", "uAspect", "uTime", "uRefr", "uSpec", "uScale", "uFoam", "uGlint",
    ];
    const U = Object.fromEntries(
      uniformNames.map((name) => [name, gl.getUniformLocation(prog, name)])
    );

    gl.uniform1f(U.uScale, CONFIG.waterScale);
    gl.uniform1f(U.uFoam, CONFIG.foam);
    gl.uniform1f(U.uGlint, CONFIG.glint);

    const texHeight = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texHeight);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uHeight, 0);

    // CPU ripple sim, low-res: prev/curr are the wave field, height is the
    // per-frame composite (ripples + ambient swell) uploaded to the GPU.
    let W = 0;
    let H = 0;
    let prev = new Float32Array(0);
    let curr = new Float32Array(0);
    let height = new Float32Array(0);
    let persp = new Float32Array(0);
    let frameNo = 0;

    const SIN = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) SIN[i] = Math.sin((i / 1024) * Math.PI * 2);
    const sinLut = (t) => SIN[(t | 0) & 1023];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr) * CONFIG.renderScale;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Keep the noise isotropic regardless of the container's aspect ratio.
      const aspect = canvas.width / Math.max(1, canvas.height);
      gl.uniform2f(U.uAspect, aspect, 1);

      W = Math.max(64, Math.round(w * CONFIG.simScale));
      H = Math.max(48, Math.round(h * CONFIG.simScale));
      prev = new Float32Array(W * H);
      curr = new Float32Array(W * H);
      height = new Float32Array(W * H);
      persp = new Float32Array(H);
      for (let y = 0; y < H; y++) {
        const t = y / (H - 1);
        persp[y] = 0.12 + t * t * 1.6;
      }
      gl.uniform2f(U.uSim, W, H);
    }

    function disturb(cx, cy, r, force) {
      const r2 = r * r;
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          const d2 = x * x + y * y;
          if (d2 > r2) continue;
          const px = (cx + x) | 0;
          const py = (cy + y) | 0;
          if (px < 1 || px > W - 2 || py < 1 || py > H - 2) continue;
          const f = 1 - Math.sqrt(d2) / r;
          prev[py * W + px] += force * f * f;
        }
      }
    }

    let mx = 0;
    let my = 0;
    let pmx = 0;
    let pmy = 0;
    let hovering = false;

    function toSim(clientX, clientY) {
      const b = container.getBoundingClientRect();
      return [((clientX - b.left) / b.width) * W, ((clientY - b.top) / b.height) * H];
    }

    function onPointerMove(e) {
      if (!W) return;
      const [x, y] = toSim(e.clientX, e.clientY);
      if (!hovering) {
        pmx = x;
        pmy = y;
        hovering = true;
      } else {
        pmx = mx;
        pmy = my;
      }
      mx = x;
      my = y;
      const dx = mx - pmx;
      const dy = my - pmy;
      const dist = Math.hypot(dx, dy);
      const steps = Math.min(20, Math.max(1, Math.round(dist / 2)));
      const force = CONFIG.strokeForce * 8 * (0.3 + Math.min(1, dist / 30) * 0.7);
      for (let i = 0; i <= steps; i++) {
        disturb(pmx + (dx * i) / steps, pmy + (dy * i) / steps, CONFIG.brushRadius, force / steps);
      }
    }

    function onPointerLeave() {
      hovering = false;
    }

    function onPointerDown(e) {
      if (!W) return;
      const [x, y] = toSim(e.clientX, e.clientY);
      disturb(x, y, CONFIG.brushRadius * 1.6, CONFIG.strokeForce * 26);
    }

    function stepWater(time) {
      frameNo++;
      if (frameNo % CONFIG.waveEvery === 0) {
        const d = CONFIG.damping;
        for (let y = 1; y < H - 1; y++) {
          const row = y * W;
          for (let x = 1; x < W - 1; x++) {
            const i = row + x;
            curr[i] = ((prev[i - 1] + prev[i + 1] + prev[i - W] + prev[i + W]) * 0.5 - curr[i]) * d;
          }
        }
        const tmp = prev;
        prev = curr;
        curr = tmp;
      }

      const A = CONFIG.swellAmp;
      if (A > 0) {
        const t = time * CONFIG.swellSpeed * 0.01;
        const surge = 0.72 + 0.28 * Math.sin(time * 0.18);
        for (let y = 0; y < H; y++) {
          const amp = A * persp[y] * surge;
          const row = y * W;
          const b1 = y * 5.2 - t * 26;
          const b2 = y * 3.1 - t * 17;
          const b3 = y * 11 - t * 44;
          for (let x = 0; x < W; x++) {
            height[row + x] =
              prev[row + x] +
              amp * (sinLut(b1 + x * 0.9) + 0.62 * sinLut(b2 - x * 2.6) + 0.18 * sinLut(b3 + x * 4.1));
          }
        }
      } else {
        height.set(prev);
      }
    }

    let raf = 0;
    let visible = true;

    function frame(ms) {
      if (!visible) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
      if (!W) return;

      const time = ms * 0.001;
      stepWater(time);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texHeight);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.FLOAT, height);

      gl.uniform1f(U.uTime, reduceMotion ? 0 : time * CONFIG.flowSpeed);
      gl.uniform1f(U.uRefr, CONFIG.refraction);
      gl.uniform1f(U.uSpec, CONFIG.specular * 22);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function startLoop() {
      if (!visible || raf) return;
      raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) startLoop();
        else stopLoop();
      },
      { root: null, threshold: 0.01 }
    );
    observer.observe(container);

    let resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    resize();
    startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      gl.deleteTexture(texHeight);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
