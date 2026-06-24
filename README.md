# WaveHome Frontend

A healthcare AI agent for seamless wellness management at home.

> Make healthcare accessible, personalized, and preventive.

The current frontend is a Vite + React prototype for a mobile-first health dashboard. It combines daily wellness metrics, weekly action planning, AI-generated health insights, and specialist agent views for sleep, posture, and fitness.

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
npm run dev
```

### Build for Production

```bash
npm run build
```

The production build is generated in `dist/`.

## Features

- Health dashboard with sleep, heart-rate, posture, activity, and alert summaries
- Weekly health plan with task completion states and habit recommendations
- AI insights view for preventive wellness guidance
- Specialist agent area for sleep, posture, and fitness workflows
- Interactive overlays for music playback and guided exercise timers
- Responsive layout designed for phone-first usage

## Tech Stack

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 4 for utility-first layout, spacing, color, responsive behavior, and component styling
- Recharts
- Radix UI components
- Lucide React icons

## Project Structure

```text
healthcare-fe/
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   └── components/
│   ├── imports/
│   └── styles/
└── README.md
```

Key files:

- `src/main.tsx`: React entry point
- `src/app/App.tsx`: Main application shell, views, mock data, and interactions
- `src/app/components/ui/`: Reusable UI components
- `src/imports/`: Imported visual assets from the design source
- `src/styles/`: Global styles, Tailwind entry, fonts, and theme CSS
- `vite.config.ts`: Vite, React, Tailwind, and path alias configuration

## Design Principles

- **Tailwind-first styling**: layout, spacing, typography, responsive states, and interaction states are primarily expressed with Tailwind utility classes directly in React components.
- **Design consistency through utilities**: reusable spacing scales, flex/grid layouts, rounded surfaces, shadows, and responsive breakpoints should be built with Tailwind instead of one-off CSS whenever practical.
- **Component-level composition**: UI sections are composed from small React components styled with Tailwind classes, keeping visual decisions close to the markup they affect.
- **Base color**: `#95d9f8`, used exclusively through opacity variants (e.g. `bg-[#95d9f8]/10` … `/100`) for depth and hierarchy instead of introducing new hues — keeps the palette calm and medical-grade clean.
- **Responsive**, mobile-first layout — the weekly plan and daily report are the primary surfaces and must work on a phone.
- **Clean and intuitive**: minimal chrome, one clear primary action per screen, generous whitespace — modeled after the "AI 라이프케어 리포트" report concept (오늘의 생활 요약 → AI 해석 → 홈케어 피드백 → 추천 루틴).
- **User flow priority**: surface *the one thing to do this week* first; let users drill into the agent-by-agent reasoning (weak signals, history) afterward, not before.

## Tailwind CSS Usage

Tailwind CSS is the main design layer for this frontend. Prefer Tailwind utilities for:

- Responsive page layout with `flex`, `grid`, breakpoint prefixes, and width constraints
- Medical dashboard spacing with `gap-*`, `p-*`, `m-*`, and `space-*`
- Typography hierarchy with text size, font weight, color, and leading utilities
- Card, panel, and control styling with border, radius, shadow, background, and opacity utilities
- Interaction polish with hover, focus, transition, transform, and animation utilities

Global CSS in `src/styles/` should stay focused on imports, theme tokens, fonts, and app-wide defaults. New screen and component styling should usually start in Tailwind classes first.

## Current Data Model

This frontend currently uses local mock data inside `src/app/App.tsx`. There is no backend API integration yet. The mock data covers:

- Sleep duration
- Exercise frequency
- Heart-rate samples
- Weekly wellness tasks
- Product recommendations
- AI recommendations
- Health notifications

When backend integration is added, these local arrays should be replaced with API-backed data fetching and shared TypeScript types.
