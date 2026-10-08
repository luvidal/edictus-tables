# Getting Started — Repo Setup

Instructions for setting up this repo from scratch (for Claude or a human).

## Prerequisites

- Node.js >= 18
- npm

## Setup

```bash
# 1. Clone and install
cd ~/GitHub/monthlyreports
npm install

# 2. Build the package
npm run build
# Outputs: dist/index.js, dist/index.mjs, dist/index.d.ts

# 3. Run unit tests
npm test
# Runs vitest against tests/

# 4. Launch visual test page
npm run preview
# Opens http://localhost:5173 with interactive test scenarios
```

## Available Scripts

| Script | What it does |
|--------|-------------|
| `npm run build` | Build with tsup → `dist/` (ESM + CJS + `.d.ts`) |
| `npm run dev` | Build in watch mode (rebuilds on file change) |
| `npm run preview` | Start Vite dev server for visual testing at `http://localhost:5173` |
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Layout

```
src/           → Component source (TypeScript + React)
tests/         → Unit tests (vitest + happy-dom)
dev/           → Visual test page (Vite + Tailwind)
dist/          → Built output (gitignored, created by npm run build)
docs/          → Documentation
```

## How to Link to the host app (Consumer)

This package is consumed by the host app via a `file:` dependency:

```bash
# In the host's package.json:
"@avd/monthlyreports": "file:../monthlyreports"

# After changing monthlyreports source:
cd ../monthlyreports && npm run build
cd ../<host-app> && npm install   # picks up rebuilt dist/
```

The host re-exports the component from `lib/reports/monthlytable.tsx`:
```ts
export { default } from '@avd/monthlyreports'
export type { Month, RowData, RowType, MonthlyTableProps } from '@avd/monthlyreports'
```

The host's `tailwind.config.ts` includes the dist path for class scanning:
```
'./node_modules/@avd/monthlyreports/dist/**/*.{js,mjs}'
```

## Development Workflow

1. **Edit source** in `src/`
2. **Run `npm run preview`** to see changes visually (Vite imports `src/` directly, no build needed)
3. **Run `npm test`** to verify logic
4. **Run `npm run build`** when ready to update the host app
5. **In the host app:** `npm install` to pick up the rebuilt package, then `npm run build` to verify integration

## Adding Tests

- Pure function tests → `tests/helpers.test.ts` or new files in `tests/`
- Test framework: vitest with happy-dom environment
- No test server needed — tests run in-process

## Adding Visual Test Scenarios

Edit `dev/main.tsx`. Each scenario is a self-contained component with its own state:

```tsx
function MyNewScenario() {
    const [rows, setRows] = useState<RowData[]>(SOME_DATA)
    return (
        <MonthlyTable
            title="My Test Case"
            months={MONTHS}
            rows={rows}
            onRowsChange={setRows}
        />
    )
}
```

Then add it to the `App` component's render output.

## Key Rules for AI Agents

1. **Read `CLAUDE.md` first** — it has the code rules, behavior docs, and Spanish copy standard
2. **No `@/` imports** — all imports within `src/` are relative
3. **Icons** — use direct lucide-react imports, not a wrapper
4. **API stability** — don't break `MonthlyTableProps` without coordinating with the host app
5. **Spanish copy** — all user-facing strings use tú (informal), never usted
6. **Run `npm test` after changes** — 44 tests must pass
7. **Run `npm run build` before committing** — ensures the package compiles
