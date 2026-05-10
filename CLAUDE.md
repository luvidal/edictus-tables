# FinanceTables

Financial table components extracted from [jogi](../jogi). Includes MonthlyTable (editable monthly spreadsheet with CRUD, grouping, drag-reorder, keyboard nav), DebtsTable, BoletasTable, TributarioTable, and AssetTable.

## Quick Reference

```bash
npm run build        # Build with tsup → dist/ (ESM + CJS + .d.ts)
npm run dev          # Build in watch mode
npm run preview      # Visual test page at http://localhost:5173
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
```

## Tech Stack

- **TypeScript** + **React** (peer dep)
- **tsup** for bundling
- **Vite** for visual dev/test page
- **Vitest** + **happy-dom** for unit tests
- **Tailwind CSS** classes (consumer must include `dist/` in their tailwind content config)
- **Unified token palette (Phase 2b)** — chrome uses `surface-*`, `ink-*`, `edge-*`; semantics use `status-ok|warn|late|pending|info`. Consumer owns the `--surface-*`, `--ink-*`, `--edge-*`, `--status-*` CSS vars. Satellite `tailwind.config.ts` maps the namespaces via `rgb(var(--x) / <alpha-value>)`; `dev/tailwind.css` mirrors the values so the Vite sandbox renders on the same dark palette the host ships.
- **lucide-react** for icons (peer dep)

## Project Structure

```
src/
├── index.tsx              # Re-export hub (no component code)
├── common/                # Shared components, hooks, utils — see common/README.md
│   ├── styles.ts          # T object — Tailwind class tokens (incl. rowBorder, rowHover)
│   ├── utils.ts           # displayCurrency, displayCurrencyCompact, generateId, formatDeletedDate, MONTH_LABELS
│   ├── editablecell.tsx   # Inline-editable table cell
│   ├── currencytoggle.tsx # UF/$ toggle button
│   ├── recyclebin.tsx     # Recycle bin footer (table-based, optional renderCells)
│   ├── usegridkeyboard.ts # Grid keyboard navigation hook (arrow keys, Tab, Enter, Escape)
│   ├── userowhover.ts    # Row hover state hook
│   └── usemobile.ts       # useIsMobile hook
├── renta/                 # RentaTable (monthly spreadsheet) — see renta/README.md
│   ├── index.tsx          # RentaTable component
│   ├── types.ts           # RowData, Month, RowType, SectionDef, RentaTableProps
│   ├── helpers.ts         # generateLastNMonths, grouping, totals
│   ├── datarow.tsx        # Single editable data row
│   ├── addrow.tsx         # "Add new row" input row
│   ├── grouprow.tsx       # Collapsible group header
│   ├── floatingaction.tsx # HeaderSelectionBar + ContextMenu
│   ├── usekeyboard.ts    # Grid keyboard navigation hook wrapper
│   └── usedragreorder.ts # Drag-and-drop reorder hook
├── assets/                # CrudTable — universal column-driven CRUD table engine
│   ├── assettable.tsx     # CrudTable component (selectable, reorderable, compound, tooltips)
│   └── types.ts           # ColumnDef, AssetTableProps, AssetRow, TablePreset, SideEffect
├── boletas/               # BoletasTable — see boletas/README.md
│   └── index.tsx
├── tributario/            # TributarioTable — see tributario/README.md
│   └── index.tsx

dev/
├── index.html             # Visual test page entry point
├── main.tsx               # Renders test scenarios with mock data
└── tailwind.css           # Tailwind base styles for dev page

tests/
├── helpers.test.ts        # Unit tests for monthly/helpers
└── utils.test.ts          # Unit tests for common/utils
```

## Compact Instructions

When compacting, preserve: file paths changed, errors found, decisions made, API changes. Drop: full file contents already read, tool output bodies.

## Communication Style

- **No emotional validation** — never say "I understand your frustration". Results matter, not words.
- **No excessive apologies** — don't apologize repeatedly. Fix the problem.
- **Be direct** — state facts, propose solutions, execute. Skip the fluff.
- **Ask for input** — when stuck or facing multiple approaches, ask rather than guessing.

## Spanish Copy Standard

All user-facing text uses informal **tú**, never **usted**:
- Imperatives: `ingresa`, `selecciona`, `agrega` (NOT `ingrese`, `seleccione`, `agregue`)
- Possessives: `tu`, `tus` (NOT `su`, `sus`)
- Pronouns: `te`, `ti`, `tú` (NOT `le`, `usted`)

## Code Rules

1. **One component per file**
2. **File naming** → lowercase, no hyphens/underscores (e.g., `editablecell.tsx`, not `editable-cell.tsx`)
3. **No `@/` imports** — all imports are relative within `src/`
4. **Icons** — use direct lucide-react imports (`import { Eye } from 'lucide-react'`), not a wrapper component
5. **Tailwind classes** — the package ships class strings but does NOT bundle CSS. Consumers add the dist path to their `tailwind.config.ts` content array
6. **API stability** — the exported props interface (`MonthlyTableProps`) must stay backward-compatible with jogi's call sites. Breaking changes require updating jogi's `lib/reports/monthlytable.tsx` re-export
7. **Optimistic updates** — always update UI immediately, then fire callbacks. Don't block UI on async responses
8. **After modifying a feature**, update this CLAUDE.md if any key behavior changed
9. **README.md maintenance** — every modification to a component folder must update its `README.md` to reflect changes. Verify that new upgrades don't cause regressions in existing functionality before marking work as complete
10. **Test coverage** — after implementing a feature, check if tests exist for the affected code (`tests/`). Update or write tests. Never leave a feature without test coverage.
11. **Planning** — for non-trivial changes, write a plan to `docs/plans/` before implementing

## Exports

```ts
// Default export
MonthlyTable

// Named type exports
Month, RowData, RowType, MonthlyTableProps

// Named function exports
generateLastNMonths

// CrudTable — universal engine for all asset-type tables
CrudTable, AssetTable  // AssetTable is an alias for CrudTable

// Other table components
BoletasTable, SummaryTable, DeclaracionTable, BalanceTable
ActivosSummary, FinalResultsCompact

// CrudTable type exports
ColumnDef, AssetTableProps, AssetRow, TablePreset

// Auto-conversion/compute helpers
applyAutoConversions, applyAutoCompute, buildUfPair
AutoConvertRule, AutoComputeRule, SideEffect

// Common components
DeleteDialog, RecycleBin, TableShell, SourceIcon, EditableCell, ClickableHeader

// Common hooks/utils
useSoftDelete
defaultFormatCurrency, displayCurrency, displayCurrencyCompact
generateId, formatDeletedDate, MONTH_LABELS

// Common type exports
SoftDeletable, TableShellProps, ColorScheme, CellOrigin
```

## Consumer Setup (jogi)

```tsx
// jogi/app/reports/situacion/tables/vehiculos.ts — declarative config
import type { ColumnDef, TablePreset } from '@jogi/tables'

const columns: ColumnDef[] = [
  { key: 'marca', label: 'Marca', type: 'text', width: '30%', isLabel: true },
  { key: 'modelo', label: 'Modelo', type: 'text', width: '30%' },
  { key: 'anio', label: 'Año', type: 'number', width: '20%', align: 'center' },
  { key: 'monto', label: 'Monto $', type: 'currency', width: '20%' },
]
export const VEHICULOS: TablePreset = { columns, idPrefix: 'vh', addPlaceholder: 'Agregar vehículo...' }

// Usage:
<CrudTable {...VEHICULOS} rows={rows} onRowsChange={onChange} colorScheme={cs} />
```

Domain row types (VehiculoRow, DeudaRow, etc.) live in jogi, not in @jogi/tables.

## Inlined Dependencies

These were copied from jogi during extraction. They are now owned by this package:

| File | Origin in jogi |
|------|---------------|
| `common/styles.ts` | `lib/reports/styles.ts` (T object) |
| `common/utils.ts` | `lib/reports/utils.ts` (displayCurrencyCompact, displayCurrency) |
| `common/usemobile.ts` | `context/device.ts` (useIsMobile) |
| `common/editablecell.tsx` | `components/forms/editablecell.tsx` |

## Key Behaviors

- **Sections**: Auto-detected from row types or explicitly provided via `sections` prop
- **Row types**: `add`/`income` (add to total), `subtract`/`deduction`/`debt` (subtract from total)
- **Grouping**: Select 2+ rows of same type → group into collapsible header. Auto-ungroups when <2 children remain
- **Drag reorder**: Rows reorder within their type family. Groups drag as a unit. 600ms hover on collapsed group auto-expands
- **Keyboard**: Arrow keys navigate cells, Enter edits, Tab moves right, Escape clears focus
- **Totals**: Header shows per-month totals. Multi-section tables show subtotal rows per section
- **Empty side**: Always renders with add-row input visible, never hidden
- **BalanceTable**: Filled rows label full-company totals as `Empresa 100%` and the editable ownership row as `Participación <x>%`; the `100%` label is not editable.
