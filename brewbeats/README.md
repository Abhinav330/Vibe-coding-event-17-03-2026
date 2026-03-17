# BrewBeats

Paste a music URL (YouTube/Spotify/SoundCloud) → get **vibe-based alcohol recommendations** (beer, wine, or whisky). Sad/melancholic → whisky; romantic → wine; party/chill/etc → beer. Recommendations update in real time when playing direct audio. Gamified with points, levels, and leaderboard.

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
| `/analyze?url=...` | POST | Returns `{ genre, country, vibe }` (mood/energy/tempo) |
| `/beers?country=DE&mood=...` | GET  | Vibe-based: returns beer, wine, or whisky by mood |
| `/leaderboard`   | GET  | Top 10 by points               |
| `/profile`        | GET  | Points, level, streak, badges  |
| `/pairing-tried`  | POST | +10 pts for trying a pairing  |

## Sprint tracker

See project spec for 3×10min sprints per team (UI/UX, Backend, Gamification) and integration sprint.
