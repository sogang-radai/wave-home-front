# WaveHome Frontend

A home health intelligence app that brings sleep, posture, power, and smart-home control into one place, fronted by a landing page and backed by an AI agent (WaveAI) for chat, insights, and goal coaching.

The frontend is a Create React App (React 19) SPA. It ships in three interchangeable data modes — `mock` (in-memory fixtures, no backend needed), `demo` (a fixed/demo dataset for live demos), and `real` (talks to the C++ `wave-server` backend and the Python agent) — so the whole app can be developed and reviewed without either backend running.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install Dependencies

```bash
npm install
```

### Run the Development Server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page reloads on changes.

By default this runs in **mock mode** — no backend required. To point at a real backend/agent instead, set `REACT_APP_API_MODE` (`mock` | `demo` | `real`) before starting; see [API layer](#api-layer--data-modes) below.

### Build for Production

```bash
npm run build
```

The production build is generated in `build/`.

## Features

- **Landing page**: a scroll-driven marketing site (`/src/landing`) — pinned category sections with a horizontally-sliding card track, split-text headline reveals, and a hand-written WebGL2 procedural ocean shader as the hero background (see [Landing page](#landing-page) below). Visited once per browser via `localStorage`, then skipped on later visits.
- **Onboarding coach marks**: a spotlight-and-tooltip product tour (`src/components/coachmarks`) that walks first-time dashboard visitors through the sidebar and key cards, with "다시 보지 않기" persisted separately from a plain close.
- **Dashboard**: current-state summary, today's tasks, power usage, and sleep summary cards
- **Sleep management**: a connected hypnogram (lane-based, color-coded by sleep stage), blood-oxygen/heart-rate/respiratory charts, sleep score breakdown, and daily/weekly AI reports
- **Posture management**: live posture gauge, sitting-time tracking, posture-break alerts, and daily/weekly AI reports
- **Weekly plan & goal coaching**: a 7-day task grid, a shared todo list with the dashboard, AI-recommended actions (approve/dismiss), and a single-active-goal coaching card (past-summary/projection/recommendations, backed by the agent's goal-coaching pipeline)
- **Smart-home control**: gesture recognition history/management, IoT device control, and a 3D "digital twin" home view (`react-three-fiber`)
- **Power management**: live usage, per-device breakdown, and trend charts
- **Smart alarm**: light-based wake alarms and schedules
- **WaveAI chat**: a popup or full-page chat that streams responses token-by-token over SSE, with tool-call visibility
- **Notifications, accounts & push**: read/unread notification panel, multi-account (household member) switching, and Web Push subscription (`src/push`)
- **Settings**: device/radar registration, automation rules, account, and general preferences

## Tech Stack

- React 19, Create React App (`react-scripts` 5)
- Tailwind CSS 3 (utilities only — `preflight` disabled so it layers on top of existing CSS instead of resetting it)
- GSAP + `@gsap/react` (`ScrollTrigger`, `SplitText`) and `lenis` — scroll choreography (pinning, scrubbed timelines, text reveals) on the landing page
- Framer Motion — hover/interaction micro-animations
- PixiJS — the particle "shatter" effect in the landing page's value-prop section
- Three.js + `@react-three/fiber` + `@react-three/drei` — the Home Twin 3D scene
- Recharts — area/bar/line charts
- `lucide-react` + `@iconify/react` — icon sets (plus some hand-rolled inline SVG icons)
- Plain CSS (`src/App.css` and per-feature `*.css` files) for the design-token system and most component styling

## API layer & data modes

Every domain has a small API facade (e.g. `src/api/sleepApi.js`) that picks an implementation at import time via `createApiClient({ mock, real, demo })` (`src/lib/apiRouter.js`), based on `API_MODE` (`src/api/config.js`, from `REACT_APP_API_MODE`, default `mock`):

- `src/api/mock/*` — pure in-memory fixtures, no network calls; this is what `npm start` uses out of the box
- `src/api/demo/*` — a fixed dataset for live/recorded demos
- `src/api/v1/*` — real HTTP calls to the backend (`REACT_APP_API_BASE_URL`, default `/api/v1`) via `httpClient`

This means new UI can be built and reviewed entirely against `mock`, and switching to `real` later is a config change, not a rewrite.

## Landing page

`src/landing` is a separate scroll-driven experience shown before the dashboard on first visit:

- `WaveCanvas.js` — a hand-written WebGL2 fragment shader that generates the hero's ocean procedurally (fractal Brownian motion with domain warping for the caustic pattern), composited with a CPU-side damped ripple simulation driven by pointer movement (refraction + specular highlight). No video or pre-rendered footage.
- `PinnedCategorySection.js` — each category section pins in place while vertical scroll drives a horizontal card-track slide (desktop) or a simple stacked reveal (mobile), via GSAP `ScrollTrigger` + `matchMedia`.
- `Hero.js` — headline text split into lines (`SplitText`) and revealed on load/scroll.
- Smooth scrolling site-wide via `lenis`, synced to GSAP's ticker.

## Project Structure

```text
wave-home-front/
├── public/
│   ├── index.html, manifest.json, push-sw.js (Web Push service worker)
│   └── favicons, logos, fonts/
├── src/
│   ├── index.js, index.css     # entry point, Tailwind import + global styles
│   ├── App.js, App.css         # app shell (landing/dashboard switch, routing, design tokens)
│   ├── api/                    # per-domain facades + mock/ demo/ v1/ implementations
│   ├── components/             # coachmarks/ layout/ notifications/ report/ ui/ icons/ calendar/
│   ├── landing/                # marketing landing page (sections/, mockups/)
│   ├── pages/                  # sleep/ posture/ plan/ alarm/ iot/ power/ homeTwin/ chat/ settings/
│   ├── scene/                  # react-three-fiber Home Twin 3D scene
│   ├── lib/, hooks/, utils/    # api router, clock/demo helpers, misc utilities
│   ├── push/                   # Web Push subscription helper
│   └── img/                    # logo and image assets
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Design Principles

- **Tailwind-first for new UI**: layout, spacing, typography, and interaction states for new screens/components are expressed with Tailwind utility classes directly in JSX. CSS files stay focused on design tokens (CSS variables), global resets, and the older component styles they already own.
- **Single base color**: `#95d9f8` (`var(--wave)` in `App.css`), used through opacity variants (`var(--wave-05)` … `var(--wave-35)`) for depth and hierarchy instead of introducing new hues. Status colors (good/warn/excellent/danger) are tokenized separately in `:root`.
- **Status text sits on a tinted pill, never bare on a surface**: status words (Good/주의/위험 등) use a `<tone>-18`/`<tone>-20` light background with the matching darker `<tone>-text` color (see `.tag`, `.posture-status-pill`), so saturated colors stay readable without breaking the pastel palette.
- **Clean and intuitive**: minimal chrome, one clear primary action per card, generous whitespace.
- **One thing to do first**: dashboards surface the day's single most actionable item (today's plan, a recommended action) before letting users drill into the underlying daily/weekly report.
