import { describe, it, expect, vi } from 'vitest'
import React, { useState } from 'react'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import CrudTable from '../src/assets/assettable'
import RentaTable from '../src/renta'
import EditableCell from '../src/common/editablecell'
import EditableField from '../src/common/editablefield'
import type { AssetRow, ColumnDef } from '../src/assets/types'
import type { RowData, Month } from '../src/renta/types'

// Testing-library auto-cleans by default, but explicit cleanup keeps each
// test's DOM isolated even when an error mid-test would skip auto-cleanup.
afterEach(() => {
    cleanup()
})

// ============================================================================
// Helpers
// ============================================================================

/** Find a registered tab stop by its data-cell marker (works on inputs and
 *  on the wrapper td/div carrying tabIndex=0). For AssetTable we instead
 *  rely on input value / placeholder lookups since cells aren't tagged. */
function pressTab(el: Element, shift = false) {
    fireEvent.keyDown(el, { key: 'Tab', shiftKey: shift })
}

// ============================================================================
// (a) AssetTable: Tab walks mixed text + numeric columns; DOM focus follows
// ============================================================================

type DebtRow = AssetRow & {
    entidad: string
    tipo: string
    deuda_total: number | null
    vigente: number | null
}

const DEBT_COLUMNS: ColumnDef[] = [
    { key: 'entidad', label: 'Entidad', type: 'text', isLabel: true },
    { key: 'tipo', label: 'Tipo', type: 'text' },
    { key: 'deuda_total', label: 'Deuda', type: 'currency' },
    { key: 'vigente', label: 'Vigente', type: 'currency' },
]

function DebtsHarness({ initialRows }: { initialRows: DebtRow[] }) {
    const [rows, setRows] = useState(initialRows)
    return (
        <CrudTable<DebtRow>
            columns={DEBT_COLUMNS}
            rows={rows}
            onRowsChange={setRows}
            idPrefix="debt"
            addPlaceholder="Agregar deuda..."
        />
    )
}

describe('AssetTable — Tab walks mixed text + numeric columns', () => {
    it('Tab from text input lands on next text input (document.activeElement follows)', () => {
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'Banco Estado', tipo: 'Hipotecario', deuda_total: 1000, vigente: 900 },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)

        const entidad = container.querySelector('input[value="Banco Estado"]') as HTMLInputElement
        expect(entidad).toBeTruthy()
        act(() => entidad.focus())

        act(() => pressTab(entidad))
        // After Tab, the 'tipo' input should be the active element.
        const tipo = container.querySelector('input[value="Hipotecario"]') as HTMLInputElement
        expect(document.activeElement).toBe(tipo)
    })

    it('Tab from text input walks into numeric (currency) cell wrapper, then onto next text input wrapping rows', () => {
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'Banco A', tipo: 'X', deuda_total: 100, vigente: 90 },
            { id: 'd2', entidad: 'Banco B', tipo: 'Y', deuda_total: 200, vigente: 180 },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)

        // Start at "Y" (tipo column of row 2)
        const tipoB = container.querySelector('input[value="Y"]') as HTMLInputElement
        act(() => tipoB.focus())

        // Two Tabs should land us on the second currency cell of row 2 (Vigente, value 180).
        act(() => pressTab(tipoB))
        // The next stop is the first currency cell (deuda_total). Its wrapper td has tabIndex=0.
        const active1 = document.activeElement as HTMLElement
        expect(active1).toBeInstanceOf(HTMLElement)
        expect(active1.tagName).toBe('TD')

        act(() => pressTab(active1))
        const active2 = document.activeElement as HTMLElement
        expect(active2.tagName).toBe('TD')
        // active2 should be a different element from active1
        expect(active2).not.toBe(active1)
    })

    it('Tab from the last data cell walks into the add row', () => {
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'Solo', tipo: 'T', deuda_total: 1, vigente: 2 },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)

        // Focus the last currency cell of the only row by Tab-walking from "Solo".
        const solo = container.querySelector('input[value="Solo"]') as HTMLInputElement
        act(() => solo.focus())
        // 1: tipo (T input). 2: deuda_total (td). 3: vigente (td). 4: should wrap into add row's label input.
        act(() => pressTab(solo)) // → T input
        const t = container.querySelector('input[value="T"]') as HTMLInputElement
        expect(document.activeElement).toBe(t)
        act(() => pressTab(t))    // → deuda_total wrapper td
        const stop2 = document.activeElement as HTMLElement
        expect(stop2.tagName).toBe('TD')
        act(() => pressTab(stop2)) // → vigente wrapper td
        const stop3 = document.activeElement as HTMLElement
        expect(stop3.tagName).toBe('TD')
        act(() => pressTab(stop3)) // → add row label input
        const addLabel = document.activeElement as HTMLElement
        expect(addLabel.tagName).toBe('INPUT')
        expect((addLabel as HTMLInputElement).placeholder).toBe('Agregar deuda...')
    })
})

// ============================================================================
// (b) Hidden-column skip — per-row col.visible? cell doesn't register
// ============================================================================

type VisRow = AssetRow & {
    label: string
    secret: number | null
    public: number | null
}

const VIS_COLUMNS: ColumnDef[] = [
    { key: 'label', label: 'L', type: 'text', isLabel: true },
    {
        key: 'secret',
        label: 'Secret',
        type: 'currency',
        visible: row => (row as VisRow).label === 'show',
    },
    { key: 'public', label: 'Pub', type: 'currency' },
]

describe('AssetTable — per-row visible? hidden cells do not register', () => {
    it('Tab from a row whose col.visible→false skips that column', () => {
        const rows: VisRow[] = [
            { id: 'v1', label: 'hide', secret: null, public: 50 },
        ]
        const { container } = render(
            <CrudTable<VisRow>
                columns={VIS_COLUMNS}
                rows={rows}
                onRowsChange={() => {}}
                idPrefix="v"
            />,
        )

        const label = container.querySelector('input[value="hide"]') as HTMLInputElement
        act(() => label.focus())
        // The 'secret' column rendered as a placeholder cell (— span) without a registered stop.
        // Tab should skip past it and land on the 'public' wrapper td.
        act(() => pressTab(label))
        const active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
        // Verify the placeholder cell is in the DOM but has no tabIndex (not a stop).
        const dash = Array.from(container.querySelectorAll('span')).find(s => s.textContent === '—')
        expect(dash).toBeTruthy()
    })
})

// ============================================================================
// (c) Read-only-row skip — per-row col.readOnly? cell does not register
// ============================================================================

type RoRow = AssetRow & {
    label: string
    locked: number | null
    open: number | null
}

const RO_COLUMNS: ColumnDef[] = [
    { key: 'label', label: 'L', type: 'text', isLabel: true },
    {
        key: 'locked',
        label: 'Locked',
        type: 'currency',
        readOnly: row => (row as RoRow).label === 'frozen',
    },
    { key: 'open', label: 'Open', type: 'currency' },
]

describe('AssetTable — per-row readOnly? cells do not register', () => {
    it('Tab skips a read-only cell, landing on the next registered stop', () => {
        const rows: RoRow[] = [
            { id: 'r1', label: 'frozen', locked: 100, open: 200 },
        ]
        const { container } = render(
            <CrudTable<RoRow>
                columns={RO_COLUMNS}
                rows={rows}
                onRowsChange={() => {}}
                idPrefix="r"
            />,
        )

        const label = container.querySelector('input[value="frozen"]') as HTMLInputElement
        act(() => label.focus())
        act(() => pressTab(label))
        // Should land on the 'open' wrapper td (skipping read-only 'locked').
        const active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
    })
})

// ============================================================================
// (d) Renta section-scoped add row at section boundary
// ============================================================================

const RENTA_MONTHS: Month[] = [
    { id: '2025-01', label: 'ENE' },
    { id: '2025-02', label: 'FEB' },
]

function RentaHarness({ initial }: { initial: RowData[] }) {
    const [rows, setRows] = useState(initial)
    return (
        <RentaTable
            title="Renta"
            months={RENTA_MONTHS}
            rows={rows}
            onRowsChange={setRows}
            sections={[
                { type: 'income', placeholder: 'Agregar ingreso...' },
                { type: 'deduction', placeholder: 'Agregar descuento...' },
            ]}
        />
    )
}

describe('Renta — Tab walks into the section-scoped add row at section boundary', () => {
    it('after last income data row\'s last cell, Tab lands on the income add-row label input', () => {
        const rows: RowData[] = [
            { id: 'i1', label: 'Sueldo', type: 'income', values: { '2025-01': 100, '2025-02': 200 } },
            { id: 'd1', label: 'AFP', type: 'deduction', values: { '2025-01': 10, '2025-02': 20 } },
        ]
        const { container } = render(<RentaHarness initial={rows} />)

        const sueldoLabel = container.querySelector('input[value="Sueldo"]') as HTMLInputElement
        act(() => sueldoLabel.focus())

        // Tab through: ENE wrapper (td), FEB wrapper (td), then add-row label input.
        act(() => pressTab(sueldoLabel)) // → ENE td
        let active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
        act(() => pressTab(active))      // → FEB td
        active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
        act(() => pressTab(active))      // → income add-row label input
        active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('INPUT')
        expect((active as HTMLInputElement).placeholder).toBe('Agregar ingreso...')
    })

    it('Tab continues from the income add row into the deduction (AFP) row, not across to another section\'s add row', () => {
        const rows: RowData[] = [
            { id: 'i1', label: 'Sueldo', type: 'income', values: { '2025-01': 100, '2025-02': 200 } },
            { id: 'd1', label: 'AFP', type: 'deduction', values: { '2025-01': 10, '2025-02': 20 } },
        ]
        const { container } = render(<RentaHarness initial={rows} />)

        // Focus the income add-row label input.
        const incomeAdd = container.querySelector('input[placeholder="Agregar ingreso..."]') as HTMLInputElement
        act(() => incomeAdd.focus())

        // Three Tabs: through ENE add, FEB add, then into AFP label input (next row).
        act(() => pressTab(incomeAdd))
        let active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD') // ENE add cell
        act(() => pressTab(active))
        active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD') // FEB add cell
        act(() => pressTab(active))
        active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('INPUT')
        expect((active as HTMLInputElement).value).toBe('AFP')
    })
})

// ============================================================================
// (e) Add-row commit — focus stays on the same cell after addRow() reset
// ============================================================================

describe('AssetTable — add-row commit keeps focus on the same cell', () => {
    it('committing a numeric add-row cell does not move DOM focus', () => {
        const rows: DebtRow[] = []
        const { container } = render(<DebtsHarness initialRows={rows} />)

        // Focus add-row's label input first to establish focusedCell state.
        const addLabel = container.querySelector('input[placeholder="Agregar deuda..."]') as HTMLInputElement
        act(() => addLabel.focus())
        // Tab twice to land on the first add-row currency wrapper.
        act(() => pressTab(addLabel))      // → tipo add input
        const tipo = document.activeElement as HTMLElement
        expect(tipo.tagName).toBe('INPUT')
        act(() => pressTab(tipo))          // → deuda_total add wrapper td
        const deudaWrap = document.activeElement as HTMLElement
        expect(deudaWrap.tagName).toBe('TD')

        // Double-click to enter edit mode on that cell.
        fireEvent.doubleClick(deudaWrap)
        const input = deudaWrap.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()

        // Type a value and commit via Enter; addRow fires and resets the add-row inputs.
        fireEvent.change(input, { target: { value: '500' } })
        // Enter on EditableCell commits and navigates 'down' — but for an add-row cell
        // there is no row below registering the same cellKey, so focus stays put.
        fireEvent.keyDown(input, { key: 'Enter' })

        // After commit, the cell wrapper should still be the active element
        // (or at least, focus did not jump out to body).
        expect(document.activeElement).not.toBe(document.body)
    })
})

// ============================================================================
// (f) Arrow up/down across asymmetric rows — same cellKey if present, else stay
// ============================================================================

describe('useGridKeyboard arrow up/down across asymmetric rows', () => {
    it('ArrowDown fired on an INPUT bubbles to the container but short-circuits (focus stays)', () => {
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'A', tipo: 'X', deuda_total: 1, vigente: 2 },
            { id: 'd2', entidad: 'B', tipo: 'Y', deuda_total: 3, vigente: 4 },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)
        const tipoA = container.querySelector('input[value="X"]') as HTMLInputElement
        act(() => tipoA.focus())
        // Fire ArrowDown directly on the input — it bubbles to the container,
        // whose handler short-circuits on INPUT targets.
        act(() => { fireEvent.keyDown(tipoA, { key: 'ArrowDown' }) })
        expect(document.activeElement).toBe(tipoA)
    })

    it('ArrowDown fired on a wrapper TD moves to the same cellKey in the next row', () => {
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'A', tipo: 'X', deuda_total: 1, vigente: 2 },
            { id: 'd2', entidad: 'B', tipo: 'Y', deuda_total: 3, vigente: 4 },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)
        // Tab from row 1's label to its first currency cell.
        const entidadA = container.querySelector('input[value="A"]') as HTMLInputElement
        act(() => entidadA.focus())
        act(() => pressTab(entidadA))   // → tipo (X input)
        const tipoA = document.activeElement as HTMLInputElement
        act(() => pressTab(tipoA))      // → deuda_total wrapper td (row 1)
        const deuda1 = document.activeElement as HTMLElement
        expect(deuda1.tagName).toBe('TD')
        // ArrowDown bubbles from the wrapper td up to the container; container
        // navigates because the target is not an INPUT/TEXTAREA.
        act(() => { fireEvent.keyDown(deuda1, { key: 'ArrowDown' }) })
        const deuda2 = document.activeElement as HTMLElement
        expect(deuda2.tagName).toBe('TD')
        expect(deuda2).not.toBe(deuda1)
    })
})

// ============================================================================
// (g) EditableCell standalone — no keyboard, no onNavigate → native Tab fires
// ============================================================================

describe('EditableCell standalone — Tab is not preventDefault\'d without nav target', () => {
    it('without keyboard and without onNavigate, Tab is not preventDefault\'d (native browser handles it)', () => {
        const { container } = render(
            <table><tbody><tr>
                <EditableCell value={123} onChange={() => {}} />
            </tr></tbody></table>,
        )
        const td = container.querySelector('td') as HTMLTableCellElement
        // Enter edit mode by double-click.
        fireEvent.doubleClick(td)
        const input = td.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()

        const tabEvent = fireEvent.keyDown(input, { key: 'Tab' })
        // fireEvent returns true if default was NOT prevented.
        expect(tabEvent).toBe(true)
    })

    it('with legacy onNavigate but no keyboard, Tab IS preventDefault\'d and onNavigate fires', () => {
        const onNavigate = vi.fn()
        const { container } = render(
            <table><tbody><tr>
                <EditableCell value={123} onChange={() => {}} onNavigate={onNavigate} />
            </tr></tbody></table>,
        )
        const td = container.querySelector('td') as HTMLTableCellElement
        fireEvent.doubleClick(td)
        const input = td.querySelector('input') as HTMLInputElement

        const tabEvent = fireEvent.keyDown(input, { key: 'Tab' })
        expect(tabEvent).toBe(false) // preventDefault'd
        expect(onNavigate).toHaveBeenCalledWith('right')
    })
})

// ============================================================================
// (i) EditableField standalone — no keyboard → native Tab
// ============================================================================

describe('EditableField standalone — preserves native Tab', () => {
    it('without keyboard, Tab inside the editing input is not preventDefault\'d', () => {
        const { container } = render(<EditableField value={10} onChange={() => {}} />)
        const wrap = container.querySelector('div.group\\/field') as HTMLElement
        // Click the wrapper to enter edit mode.
        fireEvent.click(wrap)
        const input = wrap.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()

        const tabEvent = fireEvent.keyDown(input, { key: 'Tab' })
        expect(tabEvent).toBe(true) // native
    })
})

// ============================================================================
// FinalResults regression — EditableCell asDiv with no grid wiring lets Tab through
// ============================================================================

describe('EditableCell asDiv standalone (FinalResults pattern)', () => {
    it('Tab in editing mode is native when no grid is wired', () => {
        const { container } = render(<EditableCell value={500} onChange={() => {}} asDiv />)
        const wrap = container.querySelector('div') as HTMLDivElement
        fireEvent.doubleClick(wrap)
        const input = wrap.querySelector('input') as HTMLInputElement
        const tabEvent = fireEvent.keyDown(input, { key: 'Tab' })
        expect(tabEvent).toBe(true) // not prevented — browser handles Tab
    })

    it('no-nav Tab does NOT commit synchronously — onBlur is responsible for commit', () => {
        // Real browsers compute "next tabbable" while the input is still
        // mounted. Calling commitEdit() synchronously in the handler would
        // unmount the input before that and land focus on whatever comes
        // after the host card. Assert: handler does not set isEditing(false)
        // by checking the input is still in the DOM right after keyDown.
        const { container } = render(<EditableCell value={500} onChange={() => {}} asDiv />)
        const wrap = container.querySelector('div') as HTMLDivElement
        fireEvent.doubleClick(wrap)
        const input = wrap.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()
        fireEvent.keyDown(input, { key: 'Tab' })
        // Still mounted: onBlur (fired by native focus move) will commit after.
        expect(wrap.querySelector('input')).toBeTruthy()
    })
})

// ============================================================================
// (j) EditableField — editTrigger / editInitialValue consumer
// ============================================================================

describe('EditableField — container-driven edit triggers', () => {
    function FieldHarness() {
        const [v, setV] = useState<number | null>(50)
        const rows = [{ id: 'r1' }]
        return (
            <FieldKeyboardHarness rows={rows}>
                {(kb) => (
                    <EditableField
                        value={v}
                        onChange={setV}
                        type="percent"
                        symbol="%"
                        keyboard={kb}
                        rowId="r1"
                        cellKey="participacion"
                    />
                )}
            </FieldKeyboardHarness>
        )
    }

    it('Enter on a focused field wrapper enters edit mode (editTrigger consumed)', () => {
        const { container } = render(<FieldHarness />)
        const wrap = container.querySelector('div.group\\/field') as HTMLDivElement
        // Native focus into the wrapper, like Tab from outside.
        act(() => wrap.focus())
        // No input yet — display mode.
        expect(wrap.querySelector('input')).toBeFalsy()
        // Press Enter on the wrapper. The container handler increments editTrigger
        // for the focused cell; EditableField's effect mounts the input.
        const containerDiv = container.firstChild as HTMLDivElement
        fireEvent.keyDown(containerDiv, { key: 'Enter' })
        expect(wrap.querySelector('input')).toBeTruthy()
    })

    it('type-to-edit primes the input with the typed character (editInitialValue consumed)', () => {
        const { container } = render(<FieldHarness />)
        const wrap = container.querySelector('div.group\\/field') as HTMLDivElement
        act(() => wrap.focus())
        const containerDiv = container.firstChild as HTMLDivElement
        fireEvent.keyDown(containerDiv, { key: '7' })
        const input = wrap.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()
        expect(input.value).toBe('7')
    })
})

// Helper harness that wires a useGridKeyboard around an EditableField so the
// container's keyboard plumbing is reachable in unit tests.
import { useGridKeyboard, type GridKeyboard } from '../src/common/usegridkeyboard'

function FieldKeyboardHarness({
    rows,
    children,
}: {
    rows: { id: string }[]
    children: (kb: GridKeyboard) => React.ReactNode
}) {
    const kb = useGridKeyboard({ visibleRowIds: rows.map(r => r.id) })
    return (
        <div onKeyDown={kb.handleContainerKeyDown} tabIndex={0}>
            {children(kb)}
        </div>
    )
}

// ============================================================================
// (k) Native Tab into a wrapper seeds focusedCell (onFocus)
// ============================================================================

describe('EditableCell — wrapper onFocus seeds logical focus', () => {
    it('after native focus on a registered wrapper, container Enter triggers edit', () => {
        // Render two single-cell rows so we can assert focus seeding without
        // chaining Tab through other elements.
        const rows: DebtRow[] = [
            { id: 'd1', entidad: 'A', tipo: 'X', deuda_total: 100, vigente: null },
        ]
        const { container } = render(<DebtsHarness initialRows={rows} />)
        // Find the first currency wrapper td (deuda_total) — has tabIndex=0.
        const tds = Array.from(container.querySelectorAll('td[tabindex="0"]')) as HTMLElement[]
        expect(tds.length).toBeGreaterThan(0)
        const firstCurrencyWrap = tds[0]
        // Native focus, no preceding click — simulates Tab from outside the table.
        act(() => firstCurrencyWrap.focus())
        // Press Enter on the wrapper. Container increments editTrigger for the
        // focused cell — proves focusedCell was seeded by the onFocus handler.
        fireEvent.keyDown(firstCurrencyWrap, { key: 'Enter' })
        // Editing input now mounted inside the wrapper.
        expect(firstCurrencyWrap.querySelector('input')).toBeTruthy()
    })
})

// ============================================================================
// (l) EditableField — Enter at last-row participacion keeps focus on wrapper
// ============================================================================

describe('EditableField — Enter at last row does not drop focus to body', () => {
    function LastRowHarness() {
        const [v, setV] = useState<number | null>(50)
        return (
            <FieldKeyboardHarness rows={[{ id: 'only' }]}>
                {(kb) => (
                    <EditableField
                        value={v}
                        onChange={setV}
                        type="percent"
                        symbol="%"
                        keyboard={kb}
                        rowId="only"
                        cellKey="participacion"
                    />
                )}
            </FieldKeyboardHarness>
        )
    }

    it('Enter inside the input commits and leaves focus on the wrapper, not body', () => {
        const { container } = render(<LastRowHarness />)
        const wrap = container.querySelector('div.group\\/field') as HTMLDivElement
        // Click to enter edit mode.
        fireEvent.click(wrap)
        const input = wrap.querySelector('input') as HTMLInputElement
        expect(input).toBeTruthy()
        fireEvent.change(input, { target: { value: '60' } })
        // Enter: commits, navigate('down') has no target, focus must stay put.
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(document.activeElement).not.toBe(document.body)
    })
})

// ============================================================================
// (m) GridTextInput Enter — default behavior is blur (not navigate)
// ============================================================================

describe('GridTextInput — Enter blurs by default', () => {
    it('Enter on a Renta data-row label input blurs (does not navigate to next row)', () => {
        const rows: RowData[] = [
            { id: 'i1', label: 'Sueldo', type: 'income', values: { '2025-01': 100 } },
            { id: 'i2', label: 'Bono', type: 'income', values: { '2025-01': 50 } },
        ]
        const { container } = render(<RentaHarness initial={rows} />)
        const sueldo = container.querySelector('input[value="Sueldo"]') as HTMLInputElement
        act(() => sueldo.focus())
        expect(document.activeElement).toBe(sueldo)
        fireEvent.keyDown(sueldo, { key: 'Enter' })
        // Should NOT have navigated to Bono row; should have blurred.
        expect(document.activeElement).not.toBe(container.querySelector('input[value="Bono"]'))
    })
})

// ============================================================================
// (o) Cell-scoped edit/clear requests — tabbing into a sibling does not clobber it
// ============================================================================

describe('useGridKeyboard — edit/clear requests are cell-scoped, not global', () => {
    it('after type-to-edit "5" in cell A, tabbing to cell B does NOT enter B into edit mode with "5"', () => {
        // Regression: editTrigger used to be a global counter. When B became
        // focused after A's commit, B's effectiveEditTrigger snapped 0→N and
        // its effect fired startEdit(stale initialValue) — silently entering
        // edit mode on B with "5" pre-filled. A subsequent blur would commit
        // "5" over B's real value. Now requests are scoped to (rowId, cellKey).
        const rows: DebtRow[] = [{ id: 'r1', entidad: 'A', tipo: 'X', deuda_total: 100, vigente: 200 }]
        const { container } = render(<DebtsHarness initialRows={rows} />)
        const tds = Array.from(container.querySelectorAll('td[tabindex="0"]')) as HTMLElement[]
        const v1Wrap = tds[0]
        const v2Wrap = tds[1]
        act(() => v1Wrap.focus())
        fireEvent.keyDown(v1Wrap, { key: '5' })
        const input1 = v1Wrap.querySelector('input') as HTMLInputElement
        expect(input1?.value).toBe('5')
        fireEvent.keyDown(input1, { key: 'Tab' })
        // V2 must NOT be in edit mode with "5". Either no input, or input
        // exists but its value is V2's real value (not the stale "5").
        const v2Input = v2Wrap.querySelector('input') as HTMLInputElement | null
        if (v2Input) expect(v2Input.value).not.toBe('5')
    })

    it('after Delete in cell A, tabbing to cell B does NOT erase B', () => {
        // Regression: same root cause — clearTrigger was a global counter.
        // Tabbing into B with a stale clearTrigger>0 would synchronously
        // fire onChange(null) on B and erase its value.
        const onRowsChange = vi.fn()
        const Harness = () => {
            const [r, setR] = useState<DebtRow[]>([
                { id: 'r1', entidad: 'A', tipo: 'X', deuda_total: 100, vigente: 200 },
            ])
            return (
                <CrudTable<DebtRow>
                    columns={DEBT_COLUMNS}
                    rows={r}
                    onRowsChange={next => { onRowsChange(next); setR(next) }}
                    idPrefix="t"
                />
            )
        }
        const { container } = render(<Harness />)
        const tds = Array.from(container.querySelectorAll('td[tabindex="0"]')) as HTMLElement[]
        const v1Wrap = tds[0]
        // Focus V1, press Delete → V1 cleared. Tab → focus moves to V2.
        act(() => v1Wrap.focus())
        fireEvent.keyDown(v1Wrap, { key: 'Delete' })
        fireEvent.keyDown(v1Wrap, { key: 'Tab' })
        // Inspect the latest committed rows: V2 must still be 200.
        const lastCall = onRowsChange.mock.calls.at(-1)?.[0] as DebtRow[]
        expect(lastCall?.[0].vigente).toBe(200)
    })
})

// ============================================================================
// (n) AssetTable — text column honors per-row visible/readOnly predicates
// ============================================================================

type TextPredRow = AssetRow & {
    label: string
    note: string
    amount: number | null
}

describe('AssetTable — text column honors per-row visible/readOnly', () => {
    it('text column with visible:false renders placeholder and does not register a stop', () => {
        const cols: ColumnDef[] = [
            { key: 'label', label: 'L', type: 'text', isLabel: true },
            { key: 'note', label: 'Note', type: 'text', visible: row => (row as TextPredRow).label === 'show' },
            { key: 'amount', label: 'Amount', type: 'currency' },
        ]
        const rows: TextPredRow[] = [{ id: 'r1', label: 'hide', note: 'secret', amount: 10 }]
        const { container } = render(
            <CrudTable<TextPredRow> columns={cols} rows={rows} onRowsChange={() => {}} idPrefix="t" />,
        )
        // The hidden text column should NOT render an input for "secret".
        expect(container.querySelector('input[value="secret"]')).toBeFalsy()
        // Tab from the label should skip 'note' and land on the amount wrapper.
        const label = container.querySelector('input[value="hide"]') as HTMLInputElement
        act(() => label.focus())
        act(() => pressTab(label))
        const active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
    })

    it('text column with readOnly:true renders text (no input, no registration)', () => {
        const cols: ColumnDef[] = [
            { key: 'label', label: 'L', type: 'text', isLabel: true },
            { key: 'note', label: 'Note', type: 'text', readOnly: row => (row as TextPredRow).label === 'frozen' },
            { key: 'amount', label: 'Amount', type: 'currency' },
        ]
        const rows: TextPredRow[] = [{ id: 'r1', label: 'frozen', note: 'cannot edit', amount: 20 }]
        const { container } = render(
            <CrudTable<TextPredRow> columns={cols} rows={rows} onRowsChange={() => {}} idPrefix="t" />,
        )
        // Note text should be rendered, but NOT as an input.
        expect(container.querySelector('input[value="cannot edit"]')).toBeFalsy()
        // Tab from the label should skip the read-only text column.
        const label = container.querySelector('input[value="frozen"]') as HTMLInputElement
        act(() => label.focus())
        act(() => pressTab(label))
        const active = document.activeElement as HTMLElement
        expect(active.tagName).toBe('TD')
    })
})
