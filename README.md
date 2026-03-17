# Hops and Harmonies

Vibe-coding-event-17-03-2026

A [Bun](https://bun.sh) project with TypeScript, tests, and Biome for lint/format.

## Prerequisites

- [Bun](https://bun.sh) (install: `curl -fsSL https://bun.sh/install | bash`)

## Setup

```bash
cd hops-and-harmonies
bun install
```

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `bun run dev`  | Run app with watch mode        |
| `bun run start`| Run app once                   |
| `bun run build`| Build to `dist/`               |
| `bun run test` | Run tests                      |
| `bun run lint` | Lint and check format (Biome)  |
| `bun run lint:fix` | Lint and auto-fix          |
| `bun run format`   | Format code only           |

## Project structure

```
hops-and-harmonies/
├── src/
│   ├── index.ts      # Entry point
│   └── lib/          # Shared modules
├── test/             # Tests (Bun test runner)
├── package.json
├── tsconfig.json
└── biome.json        # Lint & format config
```

## License

MIT
