# WaveHome Frontend

A home health intelligence dashboard that brings sleep, posture, and smart-home control into one place.

The current frontend is a Create React App prototype for a desktop-first, responsive health dashboard. It combines daily wellness metrics, AI-generated sleep and posture reports, a weekly action plan, and gesture-based smart-home control in a single app.

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

### Build for Production

```bash
npm run build
```

The production build is generated in `build/`.

## Features

- **Dashboard**: sleep, heart-rate, posture, and today's-tasks summary, plus a quick-look "통합 현황" overview page
- **Sleep management**: a connected hypnogram (lane-based, color-coded by sleep stage), blood-oxygen/heart-rate/respiratory charts, sleep score factors, and daily/weekly AI reports
- **Posture management**: a live posture gauge with an expression that changes with score, sitting-time tracking, posture-break alerts, and daily/weekly AI reports
- **Weekly plan**: a 7-day × category (운동/수면/식습관/멘탈) task grid, a shared todo list with the dashboard, and an AI-recommended-actions list split into approved vs. pending
- **권장 액션 (recommended actions)**: "실행"/"승인" on a report card or in the weekly plan updates the same approval state everywhere, via a small React context
- **Smart-home control**: gesture recognition history, gesture-set management, and gesture-to-IoT-device binding
- **Notifications & accounts**: a read/unread notification panel with "mark all read", and multi-account (household member) switching
- **WaveAI insight chat**: a side panel that answers canned questions about today's sleep/posture/heart-rate data
- **Settings**: radar/device registration, sleep automation settings (AC, lighting, wake alarms), account and theme/language preferences

## Tech Stack

- React 19
- Create React App (`react-scripts` 5)
- Tailwind CSS 3 (utilities only — `preflight` disabled so it layers on top of the existing CSS instead of resetting it)
- Recharts, for area/bar/line charts
- Plain CSS (`src/App.css`) for the design-token system and most component styling
- Hand-rolled inline SVG icons (no icon library)

## Project Structure

```text
wave-home-front/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico, favicon-16.png, favicon-32.png, logo192.png, logo512.png
├── src/
│   ├── index.js          # React entry point
│   ├── index.css         # Tailwind utilities import + global font/body styles
│   ├── App.js             # Entire app: pages, components, and mock data
│   ├── App.css            # Design tokens (:root) and component styles
│   └── img/                # Logo assets
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

Nearly all UI, routing (simple `page` state, no router library), and mock data currently live in the single `src/App.js` file.

## Design Principles

- **Tailwind-first for new UI**: layout, spacing, typography, and interaction states for new screens/components are expressed with Tailwind utility classes directly in JSX. `src/App.css` stays focused on design tokens (CSS variables), global resets, and the older component styles it already owns.
- **Single base color**: `#95d9f8` (`var(--wave)` in `App.css`), used through opacity variants (`var(--wave-05)` … `var(--wave-35)`) for depth and hierarchy instead of introducing new hues. Status colors (good/warn/excellent/danger) are tokenized separately in `:root`.
- **Status text sits on a tinted pill, never bare on a surface**: status words (Good/주의/위험 등) use a `<tone>-18`/`<tone>-20` light background with the matching darker `<tone>-text` color (see `.tag`, `.posture-status-pill`), so saturated colors stay readable without breaking the pastel palette.
- **Clean and intuitive**: minimal chrome, one clear primary action per card, generous whitespace.
- **One thing to do first**: dashboards surface the day's single most actionable item (today's plan, a recommended action) before letting users drill into the underlying daily/weekly report.

## Current Data Model

This frontend currently uses local mock data declared as constants at the top of `src/App.js` (sleep trends, posture logs, gesture sets, IoT devices, notifications, weekly-plan tasks, AI-recommended actions, account list, etc.). There is no backend integration yet — state for todos, notifications, accounts, and recommended-action approvals is held in React state/context and resets on reload.

When backend integration is added, these local arrays/state should be replaced with API-backed data fetching and a shared data layer.
