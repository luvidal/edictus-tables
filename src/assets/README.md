# AssetTable

Generic column-driven CRUD table used by VehiculosTable, InversionesTable, and PropiedadesTable.

## Usage

```tsx
import AssetTable from '../assets/assettable'
import type { ColumnDef } from '../assets/types'

const columns: ColumnDef[] = [
    { key: 'name', label: 'Name', type: 'text', width: '160px', isLabel: true },
    { key: 'amount', label: 'Amount', type: 'currency', width: '120px' },
]

<AssetTable columns={columns} rows={rows} onRowsChange={setRows} idPrefix="item" />
```

## Column Definition

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Field key on the row object |
| `label` | `string` | Column header text |
| `type` | `'text' \| 'currency' \| 'number'` | Determines cell rendering |
| `width` | `string` | CSS width |
| `align` | `'left' \| 'right' \| 'center'` | Cell alignment (default: left for text, right for currency/number) |
| `placeholder` | `string` | Input placeholder text |
| `isLabel` | `boolean` | First column with delete button |
| `ufPair` | `string` | Key of paired UF/CLP field (enables toggle) |
| `autoComputedClass` | `(row) => string` | CSS class for auto-computed values |
| `sourceFileIdKey` | `string` | Row field key holding source file ID — shows per-cell Eye icon on hover |

## UF/$ Toggle

When `ufValue` is provided and at least one column has `ufPair`, the column header becomes a clickable pill (via `ClickableHeader`). Clicking it toggles between UF and CLP display. In CLP mode, columns with `ufPair` switch to show the paired field with `type: 'currency'`.

## Features

- Uses `TableShell` with `renderFooter` for totals row
- Soft-delete with recycle bin (shows deleted row values)
- Grid keyboard navigation (arrow keys, Tab, Enter, Escape). Tab walks every typing cell in the row — text/label inputs, numeric `EditableCell` wrappers, and any inline `EditableField` pill — via the per-row registry in `useGridKeyboard`. From the last data row's last cell, Tab walks into the add row's first input.
- Add row with Enter key or value entry. Numeric add-row commits keep focus on the same cell after the new row spawns (ready for the next entry).
- Auto-conversion and auto-compute rules (for UF/CLP)
- Footer totals for all numeric columns
- Clickable header pill (ClickableHeader) on UF/CLP columns to toggle currency display
