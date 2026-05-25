# Common

Shared components, hooks, and utilities used across all table components. Everything in this folder is designed to ensure visual and behavioral consistency across tables.

## Files

| File | Description |
|------|-------------|
| `styles.ts` | `T` object with Tailwind class tokens for consistent table styling (incl. `rowBorder`, `rowHover`) |
| `utils.ts` | Currency formatting (`displayCurrency`, `displayCurrencyCompact`, `defaultFormatCurrency`), `generateId`, `formatDeletedDate`, `MONTH_LABELS` |
| `editablecell.tsx` | Inline-editable table cell with currency, number, text, and percent modes. Eye icon (onViewSource) renders AFTER value span — next to the number, not above it. |
| `clickableheader.tsx` | `ClickableHeader` — pill-styled clickable wrapper for header content. Used by AssetTable (UF/CLP toggle) and BoletasTable (month toggle) |
| `tableshell.tsx` | `TableShell` — single-table wrapper with colored header row + `SourceIcon` |
| `deletebutton.tsx` | `DeleteRowButton` — red X button with opacity-on-hover transition |
| `viewsourcebutton.tsx` | `ViewSourceButton` — row-level eye icon for source file viewing |
| `userowhover.ts` | `useRowHover()` — hover state tracking for table rows (accepts string or number IDs) |
| `usefieldupdate.ts` | `useFieldUpdate()` — generic row field update + remove logic |
| `usegridkeyboard.ts` | `useGridKeyboard()` — registry-based grid keyboard navigation. Cells call `register({ rowId, cellKey, ref })` on mount; arrow keys, Tab, Enter, Escape route through the registry, and `navigate(direction)` moves DOM focus by calling `ref.current.focus()` on the destination |
| `gridtextinput.tsx` | `GridTextInput` — plain text input that registers a tab stop. Used for label and text columns so Tab walks through them alongside numeric `EditableCell` stops |
| `usemobile.ts` | `useIsMobile()` media query hook (max-width: 639px) |
| `usesoftdelete.ts` | `useSoftDelete()` — generic soft-delete hook with confirm/cancel/restore state management |
| `softdeletetypes.ts` | `SoftDeletable` type — `{ deletedAt?: string; deletionReason?: string }` mixin for row types |
| `deletedialog.tsx` | `DeleteDialog` — confirmation modal with reason textarea (portal to body) |
| `recyclebin.tsx` | `RecycleBin` — table-based collapsible footer showing soft-deleted rows with restore button. Optional `renderCells` callback for extra columns (e.g., monthly values in RentaTable) |

## Usage

All tables import shared resources from this folder:

```ts
import { T } from '../common/styles'
import EditableCell from '../common/editablecell'
import DeleteRowButton from '../common/deletebutton'
import ViewSourceButton from '../common/viewsourcebutton'
import TableShell, { SourceIcon } from '../common/tableshell'
import { useRowHover } from '../common/userowhover'
import { useFieldUpdate } from '../common/usefieldupdate'
import { useGridKeyboard } from '../common/usegridkeyboard'
import GridTextInput from '../common/gridtextinput'
import { useSoftDelete } from '../common/usesoftdelete'
import DeleteDialog from '../common/deletedialog'
import RecycleBin from '../common/recyclebin'
import { defaultFormatCurrency, displayCurrencyCompact, generateId, formatDeletedDate, MONTH_LABELS } from '../common/utils'
import ClickableHeader from '../common/clickableheader'
```

### TableShell

Renders a single `<table>` with a colored `<thead>` header row and `<tbody>` for body content. Ensures header and body columns share the same grid — no alignment drift.

Key props:
- `headerBg` / `colorScheme` — header row background color
- `headerClassName` — extra classes on the header `<tr>` (e.g. border-t, text color)
- `renderHeader` — returns `<td>`/`<th>` cells for the header `<tr>`
- `children` — `<tr>` elements placed inside `<tbody>`
- `renderFooter` — optional `<tfoot>` content (e.g., totals row)
- `renderAfterContent` — optional content after the `<table>` (e.g., recycle bin, dialogs)

### SourceIcon

Small reusable eye icon button for source file viewing. Renders nothing if no `fileIds` or `onViewSource` provided. Used in table headers and row hover states.

## Adding a New Table

Every table uses `TableShell` for the single-table wrapper. Provide header cells and body rows.

### Minimal template

```tsx
import React from 'react'
import { T } from '../common/styles'
import TableShell, { SourceIcon } from '../common/tableshell'

interface MyTableProps {
    title: string
    // ... your data props
    headerBg?: string
    headerText?: string
    sourceFileIds?: string[]
    onViewSource?: (fileIds: string[]) => void
}

const MyTable = ({
    title,
    headerBg = 'bg-surface-2',
    headerText = 'text-ink-secondary',
    sourceFileIds,
    onViewSource,
}: MyTableProps) => {
    return (
        <TableShell
            headerBg={headerBg}
            renderHeader={() => (
                <>
                    <td className={`${T.headerAccordion} text-left`}>
                        <div className="flex items-center gap-2">
                            <span className={`${headerText} ${T.headerTitle}`}>{title}</span>
                            <SourceIcon fileIds={sourceFileIds} onViewSource={onViewSource} className={headerText} />
                        </div>
                    </td>
                    {/* Your header stat cells here */}
                </>
            )}
        >
            {/* Your <tr> body rows here */}
        </TableShell>
    )
}
```

### Checklist

1. **Use `TableShell`** — never create your own `<table>` wrapper. It renders the single `<table>` with `<thead>` and `<tbody>`.
2. **`renderHeader` returns `<td>` cells** — not wrapped in `<table>`, `<tbody>`, or `<tr>`. TableShell handles the wrapping.
3. **`children` are `<tr>` elements** — not wrapped in `<table>` or `<tbody>`. TableShell handles the wrapping.
4. **Use `SourceIcon`** — for the header eye icon. It handles null checks internally.
5. **Use `T` styles** — for typography classes (`T.headerTitle`, `T.th`, `T.cellLabel`, etc.).
6. **Use `EditableCell`** — for any editable numeric cells. Supports `currency`, `number`, `text`, `percent` modes.
7. **Use `DeleteRowButton`** — for row delete buttons. Handles opacity transition, icon sizing (`sm`/`default`).
8. **Use `ViewSourceButton`** — for row-level source file viewing. Returns null when no source/handler.
9. **Use `useRowHover()`** — for row hover state. Returns `getHoverProps(id)` (spread on `<tr>`) and `isHovered(id)`.
10. **Use `useFieldUpdate()`** — for generic row update/remove. Returns `updateField(id, field, value)` and `removeRow(id)`.
11. **Use `useGridKeyboard()`** — for keyboard navigation. Pass `{ visibleRowIds }`. Cells register tab stops by passing `keyboard`, `rowId`, and `cellKey` (e.g., to `EditableCell` / `EditableField`) or by rendering `GridTextInput` for label and text columns. Tab routes through `keyboard.navigate(...)` and moves `document.activeElement` to the destination ref.
12. **`renderAfterContent`** — use this for content that sits after the `<table>` (e.g., RentaTable's recycle bin and dialogs).
13. **Export from `index.tsx`** — add your component + types to the root `src/index.tsx`.
14. **Add a README** — create `src/mytable/README.md` documenting features, dependencies, and props.

### Reference implementations

- **Simple read-only**: `boletas/index.tsx` — header with stats, no editing, no row state
- **Complex with extras**: `renta/index.tsx` — keyboard nav, drag-reorder, selection, `renderAfterContent`
- **Column-driven CRUD**: `assets/assettable.tsx` — generic `AssetTable` with `renderFooter` for totals. Used by `vehiculos/`, `inversiones/`, `propiedades/` as thin config wrappers

## Consumers

- **styles.ts** — used by all tables (renta, deudas, boletas, assets)
- **editablecell.tsx** — used by renta (datarow, addrow), deudas, assets
- **tableshell.tsx** — used by renta, boletas, deudas, assets
- **utils.ts** — used by renta (helpers), boletas, finalresults, assets, deudas, recyclebin
- **clickableheader.tsx** — used by assets (UF/CLP column toggle) and boletas (month toggle)
- **recyclebin.tsx** — used by renta (with `renderCells` for month values), deudas, assets
- **userowhover.ts** — used by boletas, deudas, renta, assets
- **usemobile.ts** — used by editablecell
