import { useEffect, useRef } from "react";

// Tuned constants ported from the ocean-hero-webgl.html reference build.
const CONFIG = {
  simScale: 0.24,
  damping: 0.988,
  waveEvery: 2,
  brushRadius: 7,
  swellAmp: 2,
  swellSpeed: 55,
  refraction: 1.3,
  specular: 0.2,
  strokeForce: 2,
  playbackRate: 0.6,
  // The source clip has a "CapCut AI" watermark burned into the top-left
  // corner. Cropping this fraction off the top (before the cover-fit math
  // runs) keeps it out of frame everywhere, including right behind the
  // fixed header where the crop is tightest.
  videoTopCrop: 0.12,
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
uniform sampler2D uVideo;
uniform sampler2D uHeight;
uniform vec2  uSim;
uniform vec2  uVidScale;
uniform vec2  uVidOffset;
uniform float uRefr;
uniform float uSpec;
out vec4 frag;

void main(){
  vec2 t = 1.0 / uSim;

  float hl = texture(uHeight, vUv - vec2(t.x, 0.0)).r;
  float hr = texture(uHeight, vUv + vec2(t.x, 0.0)).r;
  float hu = texture(uHeight, vUv - vec2(0.0, t.y)).r;
  float hd = texture(uHeight, vUv + vec2(0.0, t.y)).r;
  float gx = hl - hr;
  float gy = hu - hd;

  vec2 uv = vUv + vec2(gx, gy) * uRefr * t;

  vec2 vuv = uv * uVidScale + uVidOffset;
  vuv = clamp(vuv, vec2(0.0), vec2(1.0));
  vec3 col = texture(uVideo, vuv).rgb;

  float light = (gx * 0.7 - gy * 0.7) * uSpec / 255.0;
  col += max(light, 0.0) * vec3(0.86, 0.96, 1.0);
  col += min(light, 0.0) * vec3(0.30, 0.20, 0.10);

  frag = vec4(col, 1.0);
}`;

export default function WaveCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!container || !canvas || !video) return;

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });

    // No WebGL2: fall back to a plain covering video, no ripple simulation.
    // Scaling up from the bottom edge pushes the watermarked top strip
    // (see CONFIG.videoTopCrop) out through the container's clipped edge,
    // matching what the WebGL path does via its shader-side crop.
    if (!gl) {
      canvas.style.display = "none";
      video.className = "absolute inset-0 h-full w-full object-cover opacity-100";
      video.style.transformOrigin = "50% 100%";
      video.style.transform = `scaleY(${1 / (1 - CONFIG.videoTopCrop)})`;
      video.play().catch(() => {});
      return;
    }

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

    const uniformNames = ["uVideo", "uHeight", "uSim", "uVidScale", "uVidOffset", "uRefr", "uSpec"];
    const U = Object.fromEntries(
      uniformNames.map((name) => [name, gl.getUniformLocation(prog, name)])
    );

    const texVideo = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texVideo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform1i(U.uVideo, 0);

    const texHeight = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texHeight);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uHeight, 1);

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

    function updateCover() {
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const cropTop = CONFIG.videoTopCrop;
      // Cover-fit as if the video's height were only the part below the
      // watermark, then remap that fit back into the real [cropTop, 1]
      // texture range so the top slice can never be sampled.
      const effVh = vh * (1 - cropTop);
      const cr = canvas.width / canvas.height;
      const vr = vw / effVh;
      let sx = 1;
      let sy = 1;
      if (vr > cr) sx = cr / vr;
      else sy = vr / cr;
      const offY = (1 - sy) / 2;
      gl.uniform2f(U.uVidScale, sx, sy * (1 - cropTop));
      gl.uniform2f(U.uVidOffset, (1 - sx) / 2, cropTop + offY * (1 - cropTop));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

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
      updateCover();
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

    // preload="auto" can finish loading before this effect attaches its
    // listener, so seed readiness from the current state too.
    let videoReady = video.readyState >= 2;
    let raf = 0;

    function onLoadedData() {
      videoReady = true;
      updateCover();
    }
    video.addEventListener("loadeddata", onLoadedData);
    video.playbackRate = CONFIG.playbackRate;
    video.play().catch(() => {});

    function frame(ms) {
      raf = requestAnimationFrame(frame);
      if (!W) return;
      stepWater(ms * 0.001);

      if (videoReady && video.readyState >= 2) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texVideo);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texHeight);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.FLOAT, height);

      gl.uniform1f(U.uRefr, CONFIG.refraction);
      gl.uniform1f(U.uSpec, CONFIG.specular * 22);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

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
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("loadeddata", onLoadedData);
      gl.deleteTexture(texVideo);
      gl.deleteTexture(texHeight);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute h-px w-px opacity-0"
      >
        <source src="/water-crossfade.mp4" type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
