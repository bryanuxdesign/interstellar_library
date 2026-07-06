# Interstellar Library

An immersive, high-fidelity digital encyclopedia cataloguing humanity's surface footprint on other worlds. Real hardware launched by global space agencies — active rovers, retired landers, and impact remnants — is projected onto an anatomically accurate 3D model of the Moon, letting you trace the physical history of interplanetary exploration.

This is the Moon MVP: the full user journey from the mission-control Gateway through to the unified mission dossier.

## Features

- **Interstellar Gateway** — a cinematic launchpad with a rotating lunar viewport and live global telemetry (successful landings, active assets, surface mass).
- **Planetary Insertion** — a fully interactive 3D globe with a semi-transparent command sidebar and mission registry.
- **Surface Telemetry** — coordinate-accurate pins for live hardware (pulsing), decommissioned hardware (static), and impact sites (alert markers), each with a hover micro-dashboard.
- **Mission Dossier** — a spec-sheet panel detailing launch/landing telemetry, planned-versus-actual lifespan, forensic orbital imagery for crash sites, and deep-linked primary sources.
- **Chronological Scrubber** — a bottom-fixed timeline; selecting an event flies the camera directly to that location on the surface.
- **Responsive** — a wide-screen command center on desktop and a touch-optimized layout with a bottom-sheet dossier on mobile.

## Tech Stack

- **Vite + React + TypeScript** — fast WebGL-focused single-page app
- **Three.js** via **@react-three/fiber** and **@react-three/drei** — declarative 3D
- **Tailwind CSS v4** — dark aerospace theme
- **Framer Motion** — panel and transition animation
- **Zustand** — global state (selection, filters, camera targets)
- **React Router** — Gateway and planetary routes

## Getting Started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build
npm run lint     # type-check only
```

## Project Structure

```
src/
├── data/            # planets, mission catalogue, timeline + telemetry aggregation
├── three/           # celestial mapping engine, globe, camera controller, scene
├── components/      # gateway, planet sidebar, pins, timeline, dossier, shared UI
├── pages/           # Gateway and PlanetView
├── store/           # Zustand app store
├── styles/          # design tokens + Tailwind theme
├── types/           # shared TypeScript models
└── utils/           # formatting + responsive helpers
```

## The Celestial Mapping Engine

`src/three/coordinateUtils.ts` converts selenographic latitude/longitude from space-agency archives into precise 3D positions on the globe, so every lander and impact crater aligns with its true physical location. It is the single source of truth for both pin placement and timeline camera fly-to.

## Data & Attribution

Mission data is drawn from public space-agency archives (NASA NSSDCA, CNSA, ISRO, JAXA, and others). The lunar surface texture is from the three.js public example assets; forensic imagery links to NASA imagery, with a graceful fallback when a source is unavailable.

## Roadmap

- Mars and Venus globes and mission datasets
- Rover traverse paths on the surface
- Full 3D lander/rover models
