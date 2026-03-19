# Hops and Harmonies

Next.js App Router frontend with a Bun backend service.

## Prerequisites

- Node.js 20+
- npm
- Bun (for backend scripts/tests)

## Setup

```bash
npm install
```

## Scripts

| Command           | Description                                     |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Start Next.js app on port `3000`                |
| `npm run dev:api` | Start Bun backend watcher on port `4000`        |
| `npm run dev:all` | Start backend + Next together                   |
| `npm run build`   | Build Next.js production output                 |
| `npm run start`   | Start Next.js production server on port `3000`  |
| `npm run lint`    | Biome check                                     |
| `npm run lint:fix`| Biome check with fixes                          |
| `npm run format`  | Biome format                                    |

## Project structure

```text
hops-and-harmonies/
├── src/app/                # Next.js App Router (layout/page)
├── brewbeats/backend/      # Bun backend services
├── next.config.mjs
├── tsconfig.json
└── package.json
```
