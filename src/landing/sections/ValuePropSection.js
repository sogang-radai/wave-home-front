import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Application, Particle, ParticleContainer, Texture } from "pixi.js";
import background from "../background.png";

gsap.registerPlugin(ScrollTrigger);

const LINE1 = "Introducing WaveHome";
const LINE2 = "Your Personalized Lifestyle AI Agent";
const LINE3 = "Private.  Effortless.  Sustainable.";

const WHITE_TINT = 0xffffff;

// Same bubble motif as the FloatingBubbles used elsewhere on the site (soft
// tinted body + thin rim + a bright highlight glint), baked once into a
// small canvas and reused as the single shared particle texture.
function createBubbleTexture(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;

  const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  body.addColorStop(0, "rgba(255,255,255,0.55)");
  body.addColorStop(0.55, "rgba(255,255,255,0.22)");
  body.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = size * 0.035;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  const glintX = cx - r * 0.35;
  const glintY = cy - r * 0.4;
  const glintR = r * 0.4;
  const glint = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, glintR);
  glint.addColorStop(0, "rgba(255,255,255,0.95)");
  glint.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(glintX, glintY, glintR, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

export default function ValuePropSection() {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const shatterMountRef = useRef(null);
  const overlayRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;
      const line1 = line1Ref.current;
      const line2 = line2Ref.current;
      const line3 = line3Ref.current;
      const shatterMount = shatterMountRef.current;
      const overlay = overlayRef.current;
      if (!section || !panel || !line1 || !line2 || !line3 || !shatterMount || !overlay) return;

      // Capture the headline's resting geometry before any transform is
      // applied to it, so the particle rig lines up with where the text
      // actually sits once its entrance animation has settled.
      const line2Rect = line2.getBoundingClientRect();
      const mountRect = shatterMount.getBoundingClientRect();

      gsap.set(line1, { opacity: 0, y: 12 });
      gsap.set(line2, { opacity: 0, xPercent: -6 });
      gsap.set(line3, { opacity: 0, y: 12 });

      const shatterState = { progress: 0 };
      const rig = [];
      let app = null;
      let destroyed = false;

      async function buildShatter() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.ceil(line2Rect.width));
        const h = Math.max(1, Math.ceil(line2Rect.height));

        // Rasterize the same headline, same computed font, into an
        // offscreen canvas so we can sample it into particles.
        const style = window.getComputedStyle(line2);
        const off = document.createElement("canvas");
        off.width = Math.ceil(w * dpr);
        off.height = Math.ceil(h * dpr);
        const octx = off.getContext("2d");
        if (!octx) return;
        octx.scale(dpr, dpr);
        octx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        octx.fillStyle = "#ffffff";
        octx.textBaseline = "middle";
        octx.textAlign = "center";
        octx.fillText(LINE2, w / 2, h / 2, w);

        const image = octx.getImageData(0, 0, off.width, off.height);

        const pixiApp = new Application();
        await pixiApp.init({
          resizeTo: shatterMount,
          backgroundAlpha: 0,
          antialias: true,
        });
        if (destroyed) {
          pixiApp.destroy(true);
          return;
        }
        shatterMount.appendChild(pixiApp.canvas);

        const texture = Texture.from(createBubbleTexture());

        const container = new ParticleContainer({
          dynamicProperties: { position: true, color: true, rotation: true },
        });
        pixiApp.stage.addChild(container);

        const originLeft = line2Rect.left - mountRect.left;
        const originTop = line2Rect.top - mountRect.top;
        const step = Math.max(2, Math.round(3 * dpr));

        for (let y = 0; y < off.height; y += step) {
          for (let x = 0; x < off.width; x += step) {
            const alpha = image.data[(y * off.width + x) * 4 + 3];
            if (alpha < 80) continue;

            const baseX = originLeft + x / dpr;
            const baseY = originTop + y / dpr;
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 160;
            // Skewed toward small with a long tail of bigger ones, so most
            // bubbles read as fine dust with a scattering of larger ones —
            // closer to how real foam actually looks than a flat spread.
            const scale = 0.12 + Math.random() * Math.random() * 0.6;

            const particle = new Particle({
              texture,
              x: baseX,
              y: baseY,
              anchorX: 0.5,
              anchorY: 0.5,
              scaleX: scale,
              scaleY: scale,
              alpha: 1,
              tint: WHITE_TINT,
            });
            container.addParticle(particle);

            rig.push({
              particle,
              baseX,
              baseY,
              vx: Math.cos(angle) * speed,
              // upward bias so the burst drifts and floats like the site's
              // bubbles rather than exploding straight outward
              vy: Math.sin(angle) * speed - 70,
              vr: (Math.random() - 0.5) * 5,
            });
          }
        }

        app = pixiApp;

        pixiApp.ticker.add(() => {
          const p = shatterState.progress;
          for (const item of rig) {
            item.particle.x = item.baseX + item.vx * p;
            item.particle.y = item.baseY + item.vy * p - 40 * p * p;
            item.particle.alpha = Math.max(0, 1 - p);
            item.particle.rotation += item.vr * 0.02;
          }
        });
      }

      buildShatter();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=70%",
          scrub: 0.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // This section keeps its own z-10 stacking even after the pin
          // releases, so once it unpins it would otherwise stay on top of
          // WaveAISection (z-index: auto) while it scrolls itself off —
          // a full viewport's worth of extra scroll — slowly uncovering
          // WaveAISection's background from the bottom up instead of
          // revealing it instantly. Hiding this section the moment it's
          // left/re-entered makes the swap the instant cut it's meant to be.
          onLeave: () => gsap.set(section, { autoAlpha: 0 }),
          onEnterBack: () => gsap.set(section, { autoAlpha: 1 }),
        },
      });

      // Text reveals over the first third of the pinned scroll, then the
      // shatter runs to completion. A solid cover fades in right at the
      // very end (masking any last-instant flicker at the handoff) —
      // WaveAISection is pulled up to overlap this section's tail via its
      // own `overlapPrevious` margin, so it's already pinned in place by
      // the time this section releases; the cover (part of this section)
      // scrolls away with it in that same instant, revealing WaveAISection
      // already sitting there instead of sliding up from below.
      tl.to(line1, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0)
        .to(line2, { opacity: 1, xPercent: 0, duration: 0.16, ease: "power2.out" }, 0.08)
        .to(line3, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.22)
        .set(line2, { opacity: 0 }, 0.36)
        .set(shatterMount, { opacity: 1 }, 0.36)
        .to(panel, { opacity: 0, duration: 0.22, ease: "power1.in" }, 0.34)
        .to(shatterState, { progress: 1, duration: 0.64, ease: "power1.in" }, 0.36)
        .to(overlay, { opacity: 1, duration: 0.1, ease: "power1.in" }, 0.9);

      return () => {
        destroyed = true;
        tl.scrollTrigger?.kill();
        tl.kill();
        app?.destroy(true);
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="intro"
      className="relative z-10 h-screen overflow-hidden bg-background"
    >
      <div ref={panelRef} className="absolute inset-0 z-10 flex items-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Scrim: pulls contrast back toward the copy (left/center) while
            leaving the artwork bright toward the right edge, and settles
            the top/bottom into the section's own background color. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(3,10,18,0.75) 0%, rgba(3,10,18,0.55) 38%, rgba(3,10,18,0.18) 62%, rgba(3,10,18,0) 82%)," +
              "linear-gradient(to bottom, rgba(2,6,12,0.4) 0%, rgba(2,6,12,0) 24%, rgba(2,6,12,0) 76%, rgba(2,6,12,0.5) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-10">
          <div
            ref={line1Ref}
            className="font-geist text-[13px] font-semibold uppercase tracking-[0.2em] text-wave-light"
          >
            {LINE1}
          </div>
          <h2
            ref={line2Ref}
            className="mt-4 text-[40px] font-semibold leading-[0.98] tracking-tight text-white sm:text-[64px] lg:text-[92px]"
          >
            {LINE2}
          </h2>
          <p
            ref={line3Ref}
            className="font-geist tracking-[0.08em] mt-6 max-w-xl text-xl text-white/85 sm:text-2xl"
          >
            {LINE3}
          </p>
        </div>
      </div>

      {/* Particle stand-in for the headline: sits over the whole panel (not
          just the h2's own box) so the shattered pieces have room to fly. */}
      <div
        ref={shatterMountRef}
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        aria-hidden
      />

      {/* Solid cover that fades in right as the bubbles finish and holds
          while the next section secretly settles into place behind it —
          this whole section scrolls away with it the instant the pin
          releases, so the swap reads as instantaneous, not a slide-up. */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-30 bg-background opacity-0"
        aria-hidden
      />
    </section>
  );
}
