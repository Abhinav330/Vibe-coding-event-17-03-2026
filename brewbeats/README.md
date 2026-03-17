# BrewBeats

Paste a music URL (YouTube/Spotify/SoundCloud) → get beer pairings by country/culture. Gamified with points, levels, and badges.

## EARS Core

**When** user pastes valid URL → app plays track + runs analysis → displays 3 beers (image, name, style, buy link).

## Repo structure

```
brewbeats/
├── ui/                 # React + Vite (Team 1 – UI/UX)
├── backend/
│   ├── analyzer/       # POST /analyze?url=... → { genre, country }
│   └── beer-matcher/   # GET /beers?country=... → [ { name, img, buy } ]
├── gamify/             # Gamification (Team 3): profile, points, badges
└── README.md
```

## Run locally (no Docker)

### 1. Backend – Analyzer

```bash
cd brewbeats/backend/analyzer
bun install
bun run dev
# → http://localhost:4001
```

### 2. Backend – Beer Matcher

```bash
cd brewbeats/backend/beer-matcher
bun install
bun run dev
# → http://localhost:4002
```

### 3. Gamification

```bash
cd brewbeats/gamify
bun install
bun run dev
# → http://localhost:4003
```

### 4. UI

```bash
cd brewbeats/ui
npm install
npm run dev
# → http://localhost:3000
```

Then open http://localhost:3000, paste a URL, and get beers + earn points.

## API summary

| Service      | Endpoint              | Method | Description                    |
|-------------|------------------------|--------|--------------------------------|
| analyzer    | `/analyze?url=...`     | POST   | Returns `{ genre, country }`   |
| beer-matcher| `/beers?country=DE`    | GET    | Returns 3 beers with img/buy   |
| gamify      | `/profile`             | GET    | Points, level, streak, badges  |
| gamify      | `/pairing-tried`       | POST   | +10 pts for trying a pairing   |

## Sprint tracker

See project spec for 3×10min sprints per team (UI/UX, Backend, Gamification) and integration sprint.
