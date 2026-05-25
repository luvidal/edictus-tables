---
slug: tab-navigation-unification
created: 2026-05-24
status: active
---

# Unify Tab navigation across editable cell types

## Goal

Tab walks through every typing cell in a table row uniformly, regardless of whether that cell is an `EditableCell`, an `EditableField`, or a plain `<input>` — and DOM focus follows.

## The problem

A row mixes up to five cell archetypes, three of which an analyst types into:

- `EditableCell` — numeric, two-mode (display ↔ input), integrates with `useGridKeyboard`.
- `EditableField` — pill + symbol + display value, two-mode like `EditableCell` (input only mounts while `isEditing`, see `src/common/editablefield.tsx`). Has its **own** Tab handler, not wired to the grid.
- Plain `<input type="text">` — label/text columns. Native Tab only. Explicitly excluded from `keyToPosition` (`src/assets/assettable.tsx`).

These three keyboard systems never hand off to each other. In the Deudas table (`institucion` text + `tipo_deuda` text + 4 EditableCell columns), Tab works for the first two cells (native focus chain), then falls out of the table — grid focus is never seeded for the EditableCell columns, and they have no `tabIndex` so the browser skips them.

The other two archetypes (click-to-toggle pills, read-only cells) are correctly skipped by Tab and stay out of scope.

## Why the obvious fix doesn't work

The minimum-viable fix would be: register text columns in `keyToPosition`, redirect every typing input's Tab handler to `keyboard.navigate(direction)`. That fails for three reasons that compound:

1. **`useGridKeyboard.navigate` was React state, not DOM focus** (`src/common/usegridkeyboard.ts`). The Tab handlers in `EditableCell.handleKeyDown` and `EditableField.handleKeyDown` already `preventDefault()`; redirecting them to `navigate(...)` would update `focusedCell` but never move `document.activeElement`. The destination would render a focus ring while the browser cursor stays in the old input — or drops to `<body>` when the source was an EditableCell input that just unmounted.
2. **`keyToPosition` was global** (`src/assets/assettable.tsx`), but `col.visible?(row)` and `col.readOnly?(row)` are per-row. A static column position can resolve to a non-interactive `—` or a read-only display in a specific row — so "skip read-only and hidden cells" can't be honored by a static map.
3. **Renta's index space was months-only** (`src/renta/usekeyboard.ts` — `colCount = monthCount`). Adding the label as a tab stop required both a `colCount` bump and shifting every `mi` index in `datarow.tsx`. Group headers are intentionally excluded from `visibleRowIds`. `AddRow` had no row id at all.

## The decision

**Per-row tab-stop registry, not a global key→position map.** Cells register themselves on mount; the hook owns ordered stop lists per row plus the DOM refs needed to move browser focus.

Keep the three typing-cell components distinct — their visual treatments and edit ceremonies are genuinely different (numeric format-toggle, pill, always-on text). Unify only the **focus contract**: every focusable cell registers a `{ rowId, cellKey, ref }` on mount, and `navigate(direction)` consults the registry, picks the neighbor, and calls `stop.ref.current?.focus()`.

Rejected alternative: collapse into one `EditableCell` with a `type` prop. Would force the text variant to grow a display↔edit toggle it doesn't need, or `EditableCell` to grow a "never-toggle" branch. Either way the components diverge internally to preserve the same UX they already deliver — abstraction for its own sake.

Rejected alternative: extend the global `keyToPosition` map with text columns and `tabIndex={0}` on `<td>` elements. See "Why the obvious fix doesn't work" above.

## Approach

### 1. `useGridKeyboard` — refactor to a registry

Replace static `colCount`-based navigation with a per-row ordered registry of focusable stops.

- `register({ rowId, cellKey, ref })` — call from a cell's `useEffect` on mount; returns an unregister function. `cellKey` is an explicit prop (not React's `key`, which is not visible to component internals). The registry stores `Map<rowId, GridStop[]>` in insertion order; **order is resolved at `navigate()`-time via `compareDocumentPosition`** so visibility flips and re-renders that change DOM position can't scramble traversal.
- `navigate(direction)` — looks up the current row's stop list, finds the neighbor (wrapping rows at left/right boundaries via `visibleRowIds`), and calls `stop.ref.current?.focus()`.
- `editTrigger` / `clearTrigger` — unchanged behavior. They only fire when the container catches a printable key / Delete on a non-INPUT target (the existing `handleContainerKeyDown` short-circuit in `usegridkeyboard.ts` already ensures text inputs never receive these triggers — focus is on the input, container short-circuits, end of story). No per-stop metadata needed.
- Logical `focusedCell` becomes `{ rowId, cellKey }` — drop `colIndex`, which was an artifact of the static map.
- **Cross-row resolution with asymmetric stop lists.** Different rows register different stops (per-row `col.visible?`/`col.readOnly?` predicates). For Enter and arrow up/down: if the destination row registers the same `cellKey`, focus that stop; otherwise stay put. Arrow left/right resolve strictly within the current row's stop list; at row boundaries, they wrap to the previous/next row's last/first stop (matching today's behavior).

**Two Tab entry paths, one `navigate`.** Tab from inside an `<input>` (text/label inputs, active editing in `EditableCell`/`EditableField`) is handled by the input's local `onKeyDown`. Tab from a wrapper `<td>`/`<div>` (display-state two-mode cell) is handled by the existing `handleContainerKeyDown` Tab branch (`usegridkeyboard.ts`) — which stays and just inherits the new ref-based `navigate`. Both paths call the same `navigate(direction)`; the container short-circuit on INPUT/TEXTAREA targets is unchanged.

`handleContainerKeyDown` still owns arrow keys / Enter / Escape / type-to-edit when the target is a `<td>` or `<div>` wrapper (not an `<input>`).

**Focus target — explicit.** For two-mode cells (`EditableCell`, `EditableField` in display state), the registered ref is the outer wrapper — `<td>` or `<div>` for `EditableCell`, the outer flex `<div>` at `editablefield.tsx` for `EditableField` — which carries `tabIndex={0}`. After Tab lands, `document.activeElement === wrapper`, and the existing `handleContainerKeyDown` catches type-to-edit / Enter / F2 to enter edit mode — current UX preserved. For always-on inputs (text/label columns, the add-row inputs), the registered ref is the `<input>` itself; `document.activeElement === input` and the user can type immediately.

### 2. `EditableCell` — register + accept a ref (additive)

`EditableCell` is publicly exported (`src/index.tsx`); the existing prop bundle (`focused`, `onCellFocus`, `onNavigate`, `requestEdit`, `requestClear`, `editInitialValue`) is part of the API contract per [CLAUDE.md](../../CLAUDE.md) rule 6. New props are **additive**.

- Add: `keyboard?: GridKeyboard`, `rowId?: string`, `cellKey?: string`.
- When `keyboard && rowId && cellKey` are all present, take the registry path: register on mount, route Tab through `keyboard.navigate(...)`, read focus/edit/clear state from the registry. The old per-cell props are ignored on the registry path.
- When any of the three is absent, **preserve today's behavior verbatim** — the existing `focused`/`onCellFocus`/`onNavigate`/`requestEdit`/`requestClear`/`editInitialValue` bundle stays functional for external consumers and for any internal call site not yet migrated.
- The cell's outer wrapper (`<td>` or `<div>` when `asDiv`) carries the `ref` and `tabIndex={0}` only on the registry path.

### 3. `EditableField` — opt-in grid wiring (additive)

`EditableField` is also publicly exported (`src/index.tsx`). Same additive pattern.

- Add optional props: `keyboard?: GridKeyboard`, `rowId?: string`, `cellKey?: string`.
- When all three are present, register on mount and route the existing Tab handler through `keyboard.navigate(...)`. The **outer flex `<div>`** (`editablefield.tsx`) — not the inner blue pill — carries the ref + `tabIndex={0}` in display state; the `<input>` inside takes focus naturally when editing.
- When absent, **preserve today's behavior verbatim** (`commitEdit()`, let the browser handle Tab).

### 4. `AssetTable` — register text and label inputs

- Drop the `if (col.type === 'text') continue` skip — no static position map remains anyway.
- The label `<input>` and text-column `<input>` each get their own ref and register against the registry. Local `onKeyDown` calls `keyboard.navigate(...)` on Tab. (No edit/clear metadata needed — focus on a text input means the container's `handleContainerKeyDown` short-circuits, so edit/clear triggers never reach them.)
- Wire the existing `EditableField` site at `assettable.tsx` by passing `keyboard`, `rowId`, and `col.field.key`.
- Add a synthetic add-row id (`__add__`) appended to `visibleRowIds`, and the add row's label/text/numeric inputs register against that id. Tab from the last data row's last stop walks into the add row — matching today's native Tab flow that analysts rely on. (AssetTable renders exactly one add row, so a single id suffices.)
- **Add-row commit behavior.** When a numeric add-row cell commits a value, `addRow({ [col.key]: v })` (`assettable.tsx`) spawns a new data row and resets the add-row inputs to empty. After commit, focus stays on the **same add-row cell** (now empty, ready for the next entry). Tab from that cell then moves to the *next* add-row stop, not into the freshly-created data row — because `visibleRowIds` order is `[...activeRows, __add__]`, so wrapping from `__add__`'s last stop is a no-op (don't wrap from the last row). The newly-created data row is reachable via Shift+Tab or arrow up. This matches the workflow of "fill out the add row left-to-right, last cell commits, keep typing in the next row." Same rule for Renta's section-scoped add rows.

### 5. Renta rows — register label inputs

- `datarow.tsx`, `addrow.tsx`: the label `<input>` registers as the first stop for its row id. Month-cell `EditableCell` instances register as subsequent stops, in order.
- `useKeyboard` no longer needs `monthCount` — `colCount` is derived from each row's registered stops. Update `usekeyboard.ts` accordingly (and the `monthIndex` alias falls away).
- Group rows: stay excluded from `visibleRowIds` as today. Renaming a group via Tab isn't in the stated problem; users click the group label when they need to rename it, same as today. `grouprow.tsx` is untouched by this plan.
- Add rows: Renta renders one `AddRow` per section (`renta/index.tsx` → 524), so a single `__add__` id would collide. Use **section-scoped ids** — `__add__:<sectionType>` (e.g. `__add__:income`, `__add__:deduction`, `__add__:debt`) — inserted at each section's boundary in `visibleRowIds` so Tab from the last data row of a section flows into that section's add-row label input, then into the next section's first row.

### 6. Balance — register the EditableField against the existing keyboard

Balance already wires `useGridKeyboard` at `balance/index.tsx` for its currency cells. The work here is just registering the existing `EditableField` (Participación) at `balance/index.tsx` against that keyboard:

- Pass `keyboard`, `rowId`, `cellKey="participacion"` to the `EditableField`.
- No new `useGridKeyboard` call at the Balance level — reuse the existing one.

### 7. FinalResults — keep native Tab, fix the swallow

[finalresults/index.tsx](../../src/finalresults/index.tsx) is not a grid. It renders three column *cards* (Rentas / Obligaciones / Indicadores), each containing 1–2 `EditableCell asDiv` instances laid out with flex (`finalresults/index.tsx`). There is no row/column matrix; the registry model has nothing to traverse. Tab→right from "Comprador" in column 1 has no defensible answer — column 1's next item (Codeudor)? column 2's first item (Dividendo)?

**Decision: native Tab.** Drop FinalResults from the grid-traversal acceptance. The reason Tab currently *appears* swallowed at FinalResults' four `EditableCell asDiv` sites (lines 127, 148, 167, 203) is that `editablecell.tsx` always `preventDefault()`s on Tab, even when `onNavigate` is undefined:

```ts
} else if (e.key === 'Tab') {
    e.preventDefault()
    commitEdit()
    onNavigate?.(e.shiftKey ? 'left' : 'right')
}
```

Gate the `preventDefault()` on "navigation will actually happen" — i.e. only when `keyboard` is wired (registry path) **or** the legacy `onNavigate` prop is supplied. Otherwise commit and let the browser handle Tab natively. This is a single-condition fix in `EditableCell.handleKeyDown` and restores native Tab everywhere `EditableCell` is used without grid wiring (FinalResults, and any external consumer relying on default form behavior).

## Out of scope

- Click-to-toggle pills (Naturaleza, Renta, month exclusion) — different interaction model, Tab should skip them.
- Read-only cells (totals, recycle bin) — they don't register, so they're skipped automatically.
- Merging `EditableCell` and `EditableField` — they stay separate.
- Visual / styling changes.
- Anything outside `@jogi/tables`.
- **FinalResults grid traversal** — it's a form layout, native Tab handles it (see §7).

## Acceptance

- In every editable *grid* table (Deudas, Vehículos, Inversiones, Propiedades, Balance, Renta), Tab from the first focused cell walks through every typing cell in the row in left-to-right column order, then onto the next row's first cell. **`document.activeElement` after each Tab equals the destination's registered ref DOM node** — the outer wrapper (`<td>`/`<div>`) for two-mode cells in display state, the `<input>` for always-on text inputs. Not just the logical `focusedCell`.
- FinalResults is excluded — native Tab handles it (see §7).
- Shift+Tab walks in reverse.
- Tab from the last data row's last cell flows into the add-row's first input.
- Click-to-toggle pills and read-only cells are skipped (they don't register).
- Per-row `visible?(row)` / `readOnly?(row)` cells are skipped (they don't render, so they don't register).
- Existing grid keyboard behavior (arrow keys, Enter=down, Escape, F2/type-to-edit, Delete/Backspace) unchanged. Existing `useGridKeyboard` tests are rewritten against the new registry shape.
- **Public API preservation**: `EditableCell` and `EditableField` continue to accept their existing prop bundles. Tests must cover both paths (legacy props with no `keyboard`, and registry props).
- New tests: (a) Tab traversal across mixed text + numeric columns in `AssetTable`, asserting both `focusedCell` and `document.activeElement`; (b) hidden-column skip (per-row `col.visible?` cell doesn't register); (c) read-only-row skip (per-row `col.readOnly?` cell doesn't register); (d) Tab into section-scoped add row at section boundary (Renta multi-section case); (e) Tab past add-row numeric cell commit — focus stays on the same cell after `addRow()` reset; (f) arrow up/down across asymmetric rows — same `cellKey` if present, else stay put; (g) `EditableCell` standalone (no `keyboard`, no legacy `onNavigate`) — Tab is **not** preventDefault'd, native browser Tab fires; (h) `EditableCell` standalone (legacy `onNavigate` supplied, no `keyboard`) preserves prior behavior; (i) `EditableField` standalone (no `keyboard`) preserves native Tab.

## Implementation order

1. `useGridKeyboard` registry refactor + ref handoff. Rewrite existing tests against the new shape; they should pass before any cell-side wiring.
2. `EditableCell` additive props + gate `preventDefault()` on Tab (FinalResults fix lands here, before any grid wiring touches it).
3. `AssetTable` text/label inputs + `AssetTable` add row. Smallest blast radius — one preset (Deudas) exercises the full mix.
4. Renta rows (`datarow`, `grouprow`, `addrow`) + `usekeyboard.ts` simplification (section-scoped add-row ids).
5. `EditableField` opt-in props + `AssetTable` wiring for the inline-field column.
6. Balance: register the existing `EditableField` against Balance's existing `useGridKeyboard`.
7. Cross-table integration tests, including FinalResults native-Tab regression test.

## Expected paths

- src/common/usegridkeyboard.ts
- src/common/editablecell.tsx
- src/common/editablefield.tsx
- src/assets/assettable.tsx
- src/renta/usekeyboard.ts
- src/renta/index.tsx
- src/renta/datarow.tsx
- src/renta/addrow.tsx
- src/balance/index.tsx
- tests/ — registry unit tests, cross-type Tab traversal, DOM-focus assertions, asymmetric-row arrow nav, add-row commit behavior, EditableCell/EditableField standalone fallback (no `preventDefault` on Tab), FinalResults native-Tab regression
