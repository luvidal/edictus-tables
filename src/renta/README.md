# MonthlyTable

Editable monthly spreadsheet with CRUD, grouping, drag-reorder, keyboard navigation, and soft-delete with recycle bin.

## Features

- **Sections**: Auto-detected from row types or explicitly provided via `sections` prop
- **Row types**: `add`/`income` (add to total), `subtract`/`deduction`/`debt` (subtract from total)
- **Grouping**: Select 2+ rows of same type family, group into collapsible header. Auto-ungroups when <2 children remain
- **Drag reorder**: Rows reorder within their type family. Groups drag as a unit. 600ms hover on collapsed group auto-expands
- **Keyboard**: Arrow keys navigate cells, Enter edits, Tab walks every typing cell in the row — including label inputs — via the per-row registry in `useGridKeyboard`. At each section's last data row, Tab walks into that section's add-row label, then onto the next section. Escape clears focus.
- **Totals**: Header shows per-month totals. Multi-section tables show subtotal rows per section
- **Soft-delete**: Rows go to recycle bin (common `RecycleBin` with `renderCells` for monthly values) with reason. Can be restored
- **Selection**: Checkbox per row, Cmd/Ctrl+click anywhere on row to toggle selection, right-click context menu for bulk actions

## Files

| File | Description |
|------|-------------|
| `index.tsx` | Main MonthlyTable component |
| `types.ts` | `RowData`, `Month`, `RowType`, `SectionDef`, `MonthlyTableProps` |
| `helpers.ts` | `generateLastNMonths`, row type checks, grouping, totals, soft-delete (14 exports) |
| `datarow.tsx` | Single editable data row with label and month values |
| `addrow.tsx` | "Add new row" input row per section |
| `grouprow.tsx` | Collapsible group header row (computed sums) |
| `floatingaction.tsx` | `HeaderSelectionBar` + `ContextMenu` (right-click on selected rows) |
| `usekeyboard.ts` | Thin pass-through to `useGridKeyboard` (registry-based focus) |
| `usedragreorder.ts` | HTML5 drag-and-drop reorder hook |

## Dependencies

- `../common/tableshell` — `TableShell` single-table wrapper + `SourceIcon`
- `../common/styles` — `T` object for Tailwind classes
- `../common/editablecell` — inline-editable cells (via datarow, addrow)
- `../common/userowhover` — `useRowHover()` for row hover state
- `../common/deletedialog` — `DeleteDialog` for soft-delete confirmation
- `../common/recyclebin` — `RecycleBin` with `renderCells` for monthly value columns

## Props

```ts
interface MonthlyTableProps {
    title: string
    months: Month[] | number          // Month array or count (generates last N months)
    rows: RowData[]
    onRowsChange: (rows: RowData[]) => void
    sections?: SectionDef[]           // Explicit sections (auto-detected if omitted)
    headerBg?: string                 // Tailwind bg class (default: 'bg-surface-2')
    headerText?: string               // Tailwind text class (default: 'text-ink-secondary')
    forceExpanded?: boolean           // Force group headers expanded (e.g., print mode)
    formatValue?: (value: number) => string
    calculateTotal?: (monthId: string, rows: RowData[]) => number
    sourceFileIds?: string[]
    onViewSource?: (fileIds: string[]) => void
}
```
