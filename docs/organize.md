# Codebase Reorganization Plan

## Problem

All 18 source files live in a flat `src/` directory. As more tables are added, it's unclear which files belong to which table. Shared utilities aren't explicitly separated from table-specific code, making visual consistency harder to enforce.

## Target Structure

```
src/
├── index.tsx                    # Re-export hub only (no component code)
│
├── common/                      # Shared across ALL tables
│   ├── styles.ts                # T object — Tailwind class tokens
│   ├── utils.ts                 # displayCurrency, displayCurrencyCompact
│   ├── editablecell.tsx         # Inline-editable table cell
│   ├── usemobile.ts             # useIsMobile hook
│   └── README.md
│
├── monthly/                     # MonthlyTable (most advanced)
│   ├── index.tsx                # MonthlyTable component
│   ├── types.ts                 # RowData, Month, RowType, SectionDef, MonthlyTableProps
│   ├── helpers.ts               # generateLastNMonths, grouping, totals
│   ├── datarow.tsx              # Single editable data row
│   ├── addrow.tsx               # "Add new row" input row
│   ├── grouprow.tsx             # Collapsible group header
│   ├── floatingaction.tsx       # HeaderSelectionBar + ContextMenu
│   ├── usekeyboard.ts          # Grid keyboard navigation hook
│   ├── usedragreorder.ts       # Drag-and-drop reorder hook
│   ├── deletedialog.tsx         # Soft-delete confirmation modal
│   ├── recyclebin.tsx           # Recycle bin footer
│   └── README.md
│
├── debts/                       # DebtsTable
│   ├── index.tsx
│   └── README.md
│
├── boletas/                     # BoletasTable
│   ├── index.tsx
│   └── README.md
│
├── tributario/                  # TributarioTable
│   ├── index.tsx
│   └── README.md
│
└── assets/                      # AssetTable
    ├── index.tsx
    └── README.md
```

## File Migration Map

### Common (shared by multiple tables)

| Current location | New location | Used by |
|-----------------|-------------|---------|
| `src/styles.ts` | `src/common/styles.ts` | ALL tables (T object) |
| `src/utils.ts` | `src/common/utils.ts` | helpers, editablecell, boletas, tributario |
| `src/editablecell.tsx` | `src/common/editablecell.tsx` | monthly (datarow, addrow), debts, assets |
| `src/usemobile.ts` | `src/common/usemobile.ts` | editablecell |

### MonthlyTable (12 files)

| Current location | New location |
|-----------------|-------------|
| `src/index.tsx` (component code) | `src/monthly/index.tsx` |
| `src/types.ts` | `src/monthly/types.ts` |
| `src/helpers.ts` | `src/monthly/helpers.ts` |
| `src/datarow.tsx` | `src/monthly/datarow.tsx` |
| `src/addrow.tsx` | `src/monthly/addrow.tsx` |
| `src/grouprow.tsx` | `src/monthly/grouprow.tsx` |
| `src/floatingaction.tsx` | `src/monthly/floatingaction.tsx` |
| `src/usekeyboard.ts` | `src/monthly/usekeyboard.ts` |
| `src/usedragreorder.ts` | `src/monthly/usedragreorder.ts` |
| `src/deletedialog.tsx` | `src/monthly/deletedialog.tsx` |
| `src/recyclebin.tsx` | `src/monthly/recyclebin.tsx` |

### Standalone Tables

| Current location | New location |
|-----------------|-------------|
| `src/debtstable.tsx` | `src/debts/index.tsx` |
| `src/boletastable.tsx` | `src/boletas/index.tsx` |
| `src/tributariotable.tsx` | `src/tributario/index.tsx` |
| `src/assettable.tsx` | `src/assets/index.tsx` |

## Import Changes

Only files that cross folder boundaries need import updates:

| File (new path) | Old import | New import |
|-----------------|-----------|------------|
| `monthly/index.tsx` | `'./styles'` | `'../common/styles'` |
| `monthly/helpers.ts` | `'./utils'` | `'../common/utils'` |
| `monthly/datarow.tsx` | `'./editablecell'` | `'../common/editablecell'` |
| `monthly/datarow.tsx` | `'./styles'` | `'../common/styles'` |
| `monthly/addrow.tsx` | `'./editablecell'` | `'../common/editablecell'` |
| `monthly/addrow.tsx` | `'./styles'` | `'../common/styles'` |
| `debts/index.tsx` | `'./editablecell'` | `'../common/editablecell'` |
| `debts/index.tsx` | `'./styles'` | `'../common/styles'` |
| `boletas/index.tsx` | `'./utils'` | `'../common/utils'` |
| `boletas/index.tsx` | `'./styles'` | `'../common/styles'` |
| `tributario/index.tsx` | `'./utils'` | `'../common/utils'` |
| `tributario/index.tsx` | `'./styles'` | `'../common/styles'` |
| `assets/index.tsx` | `'./editablecell'` | `'../common/editablecell'` |
| `assets/index.tsx` | `'./styles'` | `'../common/styles'` |
| `tests/helpers.test.ts` | `'../src/helpers'` | `'../src/monthly/helpers'` |
| `tests/helpers.test.ts` | `'../src/types'` | `'../src/monthly/types'` |
| `tests/utils.test.ts` | `'../src/utils'` | `'../src/common/utils'` |
| `dev/main.tsx` | `'../src/types'` | `'../src'` |

## New Root `src/index.tsx`

Becomes a pure re-export hub with zero component logic:

```ts
// MonthlyTable
export { default } from './monthly'
export type { Month, RowData, RowType, MonthlyTableProps } from './monthly/types'
export { generateLastNMonths } from './monthly/helpers'

// DebtsTable
export { default as DebtsTable } from './debts'
export type { DebtEntry, DebtsTableProps } from './debts'

// BoletasTable
export { default as BoletasTable } from './boletas'
export type { BoletaMonth, BoletasTableProps } from './boletas'

// TributarioTable
export { default as TributarioTable } from './tributario'
export type { TributarioEntry, TributarioTableProps } from './tributario'

// AssetTable
export { default as AssetTable } from './assets'
export type { AssetRowData, AssetTableProps } from './assets'
```

## CLAUDE.md Updates

1. Update **Project Structure** to reflect folder layout
2. Add code rule: **README.md maintenance** — every modification to a component folder must update its README.md and verify no regressions in existing functionality
3. Update **Inlined Dependencies** paths to `common/`

## No Config Changes Needed

- `tsup.config.ts` entry: `src/index.tsx` (unchanged)
- `vitest.config.ts` glob: `tests/**/*.test.{ts,tsx}` (unchanged)
- `tailwind.config.ts` content: `src/**/*.{ts,tsx}` (recursive, covers subfolders)
- `package.json`: no changes

## Verification

1. `npm run build` — must succeed with identical exports
2. `npm test` — both test files pass
3. `npm run preview` — visual test page renders correctly
4. Consumer (host app) imports from `@avd/financetables` — unchanged public API
