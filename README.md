# @edictus/tables

Financial table components for React and TypeScript, built for credit analysts
working over Chilean payroll, tax and asset data. Includes editable monthly
income spreadsheets, fee-receipt and tax-return tables, balance sheets,
summaries, and a generic column-driven CRUD table.

## Highlights

- **`RentaTable`** is a spreadsheet-style monthly table with:
  - grouped and collapsible rows;
  - inline editing;
  - keyboard grid navigation (arrows, Tab, Enter, Escape);
  - drag-and-drop reordering;
  - per-section "add row" inputs.
- **`CrudTable`** is one column-driven engine (`ColumnDef`, `TablePreset`)
  behind every asset-type table. It supports selection, reordering, compound
  cells and automatic field conversions, such as UF ↔ CLP with `buildUfPair`.
- **Domain tables:**
  - `BoletasTable` (fee receipts)
  - `DeclaracionTable` (tax returns)
  - `BalanceTable`
  - `SummaryTable`
  - `ActivosSummary`
  - `FinalResultsCompact`
- **Soft delete with a recycle bin** (`useSoftDelete`, `RecycleBin`), plus
  optimistic updates: the UI changes first and the callbacks fire after.
- **Token-driven theming** through `surface` / `ink` / `edge` / `status` CSS
  variables. This pairs with [`@edictus/theme`](https://github.com/luvidal/edictus-theme).
- **121 tests** written with Vitest and happy-dom.

## Install

```bash
npm i github:luvidal/edictus-tables#<commit-sha>
```

Peer dependencies: `react` and `react-dom` ≥ 18, and `lucide-react`. Add
`./node_modules/@edictus/tables/dist/**/*.{js,mjs}` to your Tailwind `content`.

## Usage

```tsx
import { useState } from 'react'
import RentaTable, { type RowData } from '@edictus/tables'

export function IncomeTable() {
  const [rows, setRows] = useState<RowData[]>([
    { id: 'base', label: 'Sueldo base', type: 'income', values: {} },
    { id: 'afp', label: 'Cotización AFP', type: 'deduction', values: {} },
  ])
  return <RentaTable title="Renta líquida" months={3} rows={rows} onRowsChange={setRows} />
}
```

Component notes live next to the code:
- [RentaTable](src/renta/README.md)
- [CrudTable](src/assets/README.md)
- [BoletasTable](src/boletas/README.md)
- [shared pieces](src/common/README.md)

## Development

```bash
npm run preview   # visual test page with mock data (Vite) at http://localhost:5173
npm test          # Vitest + happy-dom
npm run build     # tsup → dist/ (ESM + CJS + type declarations)
```
