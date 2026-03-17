# BrewBeats

Paste a music URL (YouTube/Spotify/SoundCloud) → get beer pairings by country/culture. Gamified with points, levels, and badges.

## EARS Core

**When** user pastes valid URL → app plays track + runs analysis → displays 3 beers (image, name, style, buy link).

## Repo structure

```
brewbeats/
├── ui/                 # React + Vite – single UI (port 3000)
├── backend/
│   └── index.ts        # Single API server (port 4000): analyze, beers, profile, gamify
└── README.md
```

## Run locally (one project, one API port)

**Terminal 1 – API (port 4000)**

```bash
bun run dev
# → http://localhost:4000
```

**Terminal 2 – UI (port 3000)**

```bash
bun run dev:ui
# → http://localhost:3000
```

Then open http://localhost:3000, paste a URL, and get beers + earn points.

## API summary (single server :4000)

| Endpoint         | Method | Description                    |
|------------------|--------|--------------------------------|
| `/analyze?url=...` | POST | Returns `{ genre, country }`   |
| `/beers?country=DE` | GET  | Returns 3 beers with img/buy   |
| `/profile`        | GET  | Points, level, streak, badges  |
| `/pairing-tried`  | POST | +10 pts for trying a pairing  |

## Sprint tracker

See project spec for 3×10min sprints per team (UI/UX, Backend, Gamification) and integration sprint.
