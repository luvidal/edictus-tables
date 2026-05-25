import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRowHover } from '../src/common/userowhover'
import { useFieldUpdate } from '../src/common/usefieldupdate'
import { useGridKeyboard } from '../src/common/usegridkeyboard'
import DeleteRowButton from '../src/common/deletebutton'
import ViewSourceButton from '../src/common/viewsourcebutton'

// ============================================================================
// useGridKeyboard — registry-based focus model
// ============================================================================

describe('useGridKeyboard', () => {
    const rowIds = ['r1', 'r2', 'r3']

    afterEach(() => {
        document.body.innerHTML = ''
    })

    /** Set up a hook + helpers for registering DOM-backed stops. Elements are
     *  appended in registration order so compareDocumentPosition orders them
     *  the same way. */
    function setup(visibleRowIds = rowIds) {
        const hook = renderHook(({ ids }) => useGridKeyboard({ visibleRowIds: ids }), {
            initialProps: { ids: visibleRowIds },
        })
        const elements: Record<string, HTMLElement> = {}

        function register(rowId: string, cellKey: string) {
            const el = document.createElement('div')
            el.tabIndex = 0
            el.dataset.cell = `${rowId}:${cellKey}`
            document.body.appendChild(el)
            const ref = { current: el } as React.RefObject<HTMLElement | null>
            elements[`${rowId}:${cellKey}`] = el
            act(() => {
                hook.result.current.register({ rowId, cellKey, ref })
            })
            return el
        }

        return { ...hook, register, elements }
    }

    it('starts with no focused cell', () => {
        const { result } = setup()
        expect(result.current.focusedCell).toBeNull()
        expect(result.current.isFocused('r1', 'a')).toBe(false)
    })

    it('focus sets the focused cell (state only)', () => {
        const { result } = setup()
        act(() => result.current.focus('r2', 'b'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r2', cellKey: 'b' })
        expect(result.current.isFocused('r2', 'b')).toBe(true)
        expect(result.current.isFocused('r1', 'a')).toBe(false)
    })

    it('clearFocus clears the focused cell', () => {
        const { result } = setup()
        act(() => result.current.focus('r1', 'a'))
        act(() => result.current.clearFocus())
        expect(result.current.focusedCell).toBeNull()
    })

    it('navigate right walks to the next stop in the same row and moves DOM focus', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r1', 'c')
        act(() => result.current.focus('r1', 'a'))
        act(() => result.current.navigate('right'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'b' })
        expect(document.activeElement).toBe(elements['r1:b'])
    })

    it('navigate right at the last stop wraps to the next row', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r2', 'x')
        register('r2', 'y')
        act(() => result.current.focus('r1', 'b'))
        act(() => result.current.navigate('right'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r2', cellKey: 'x' })
        expect(document.activeElement).toBe(elements['r2:x'])
    })

    it('navigate right at the table end stays put', () => {
        const { result, register } = setup()
        register('r1', 'a')
        register('r2', 'a')
        register('r3', 'a')
        act(() => result.current.focus('r3', 'a'))
        act(() => result.current.navigate('right'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r3', cellKey: 'a' })
    })

    it('navigate left walks to the previous stop in the same row', () => {
        const { result, register, elements } = setup()
        register('r2', 'a')
        register('r2', 'b')
        act(() => result.current.focus('r2', 'b'))
        act(() => result.current.navigate('left'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r2', cellKey: 'a' })
        expect(document.activeElement).toBe(elements['r2:a'])
    })

    it('navigate left at first stop wraps to previous row last stop', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r2', 'x')
        act(() => result.current.focus('r2', 'x'))
        act(() => result.current.navigate('left'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'b' })
        expect(document.activeElement).toBe(elements['r1:b'])
    })

    it('navigate left at table start stays put', () => {
        const { result, register } = setup()
        register('r1', 'a')
        register('r2', 'a')
        act(() => result.current.focus('r1', 'a'))
        act(() => result.current.navigate('left'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'a' })
    })

    it('navigate down moves to the same cellKey in the next row', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r2', 'a')
        register('r2', 'b')
        act(() => result.current.focus('r1', 'b'))
        act(() => result.current.navigate('down'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r2', cellKey: 'b' })
        expect(document.activeElement).toBe(elements['r2:b'])
    })

    it('navigate down with no matching cellKey in next row stays put (asymmetric)', () => {
        const { result, register } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r2', 'a')
        // r2 has no 'b' stop
        act(() => result.current.focus('r1', 'b'))
        act(() => result.current.navigate('down'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'b' })
    })

    it('navigate up moves to the same cellKey in the previous row', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        register('r2', 'a')
        register('r2', 'b')
        act(() => result.current.focus('r2', 'a'))
        act(() => result.current.navigate('up'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'a' })
        expect(document.activeElement).toBe(elements['r1:a'])
    })

    it('navigate up at first row stays put', () => {
        const { result, register } = setup()
        register('r1', 'a')
        register('r2', 'a')
        act(() => result.current.focus('r1', 'a'))
        act(() => result.current.navigate('up'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'a' })
    })

    it('navigate down skips over rows that register nothing', () => {
        const { result, register, elements } = setup(['r1', 'r2', 'r3'])
        register('r1', 'a')
        // r2 registers no stops
        register('r3', 'a')
        act(() => result.current.focus('r1', 'a'))
        act(() => result.current.navigate('down'))
        expect(result.current.focusedCell).toEqual({ rowId: 'r3', cellKey: 'a' })
        expect(document.activeElement).toBe(elements['r3:a'])
    })

    it('navigate with no focused cell does nothing', () => {
        const { result, register } = setup()
        register('r1', 'a')
        act(() => result.current.navigate('right'))
        expect(result.current.focusedCell).toBeNull()
    })

    it('navigate ignores focused cell whose rowId is not in visibleRowIds', () => {
        const { result, register } = setup()
        register('r1', 'a')
        act(() => result.current.focus('not-in-list', 'a'))
        act(() => result.current.navigate('right'))
        // focus state stays where the caller put it; navigate is a no-op
        expect(result.current.focusedCell).toEqual({ rowId: 'not-in-list', cellKey: 'a' })
    })

    it('unregister removes a stop from the row list', () => {
        const hook = renderHook(() => useGridKeyboard({ visibleRowIds: rowIds }))
        const elA = document.createElement('div')
        const elB = document.createElement('div')
        document.body.appendChild(elA)
        document.body.appendChild(elB)
        const refA = { current: elA } as React.RefObject<HTMLElement | null>
        const refB = { current: elB } as React.RefObject<HTMLElement | null>

        let unregB: () => void = () => {}
        act(() => {
            hook.result.current.register({ rowId: 'r1', cellKey: 'a', ref: refA })
            unregB = hook.result.current.register({ rowId: 'r1', cellKey: 'b', ref: refB })
        })

        act(() => unregB())
        act(() => hook.result.current.focus('r1', 'a'))
        act(() => hook.result.current.navigate('right'))
        // 'b' is gone — right at last stop with no following row stops should stay
        expect(hook.result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'a' })
    })

    it('handleContainerKeyDown Tab navigates via the registry', () => {
        const { result, register, elements } = setup()
        register('r1', 'a')
        register('r1', 'b')
        act(() => result.current.focus('r1', 'a'))
        const e = {
            key: 'Tab',
            shiftKey: false,
            target: document.body,
            preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        act(() => result.current.handleContainerKeyDown(e))
        expect((e.preventDefault as any).mock.calls.length).toBe(1)
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'b' })
        expect(document.activeElement).toBe(elements['r1:b'])
    })

    it('handleContainerKeyDown short-circuits when target is an INPUT', () => {
        const { result, register } = setup()
        register('r1', 'a')
        register('r1', 'b')
        act(() => result.current.focus('r1', 'a'))
        const input = document.createElement('input')
        document.body.appendChild(input)
        const e = {
            key: 'Tab',
            shiftKey: false,
            target: input,
            preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        act(() => result.current.handleContainerKeyDown(e))
        // INPUT short-circuits — no preventDefault, no navigate
        expect((e.preventDefault as any).mock.calls.length).toBe(0)
        expect(result.current.focusedCell).toEqual({ rowId: 'r1', cellKey: 'a' })
    })

    it('editRequest / clearRequest start as null', () => {
        const { result } = setup()
        expect(result.current.editRequest).toBeNull()
        expect(result.current.clearRequest).toBeNull()
    })

    it('Enter on container sets editRequest scoped to the focused cell', () => {
        const { result, register } = setup()
        register('r1', 'a')
        act(() => result.current.focus('r1', 'a'))
        const e = {
            key: 'Enter',
            target: document.body,
            preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        act(() => result.current.handleContainerKeyDown(e))
        expect(result.current.editRequest).toEqual({
            rowId: 'r1', cellKey: 'a', initialValue: null, n: 1,
        })
    })

    it('Delete on container sets clearRequest scoped to the focused cell', () => {
        const { result, register } = setup()
        register('r1', 'a')
        act(() => result.current.focus('r1', 'a'))
        const e = {
            key: 'Delete',
            target: document.body,
            preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        act(() => result.current.handleContainerKeyDown(e))
        expect(result.current.clearRequest).toEqual({ rowId: 'r1', cellKey: 'a', n: 1 })
    })

    it('printable key on container sets editRequest with the typed character', () => {
        const { result, register } = setup()
        register('r1', 'a')
        act(() => result.current.focus('r1', 'a'))
        const e = {
            key: '5',
            target: document.body,
            preventDefault: vi.fn(),
            ctrlKey: false,
            metaKey: false,
            altKey: false,
        } as unknown as React.KeyboardEvent
        act(() => result.current.handleContainerKeyDown(e))
        expect(result.current.editRequest).toEqual({
            rowId: 'r1', cellKey: 'a', initialValue: '5', n: 1,
        })
    })
})

// ============================================================================
// useRowHover
// ============================================================================

describe('useRowHover', () => {
    it('starts with no hovered row', () => {
        const { result } = renderHook(() => useRowHover())
        expect(result.current.hoveredRow).toBeNull()
        expect(result.current.isHovered('any')).toBe(false)
    })

    it('sets hovered row on mouseEnter', () => {
        const { result } = renderHook(() => useRowHover())
        act(() => result.current.getHoverProps('row-1').onMouseEnter())
        expect(result.current.isHovered('row-1')).toBe(true)
        expect(result.current.isHovered('row-2')).toBe(false)
    })

    it('clears hovered row on mouseLeave', () => {
        const { result } = renderHook(() => useRowHover())
        act(() => result.current.getHoverProps('row-1').onMouseEnter())
        act(() => result.current.getHoverProps('row-1').onMouseLeave())
        expect(result.current.isHovered('row-1')).toBe(false)
    })
})

// ============================================================================
// useFieldUpdate
// ============================================================================

describe('useFieldUpdate', () => {
    type Row = { id: string; name: string; value: number }

    it('updates a specific field on a row', () => {
        const onChange = vi.fn()
        const rows: Row[] = [
            { id: '1', name: 'A', value: 10 },
            { id: '2', name: 'B', value: 20 },
        ]
        const { result } = renderHook(() => useFieldUpdate(rows, onChange))

        act(() => result.current.updateField('1', 'name', 'Updated' as any))
        expect(onChange).toHaveBeenCalledWith([
            { id: '1', name: 'Updated', value: 10 },
            { id: '2', name: 'B', value: 20 },
        ])
    })

    it('removes a row by id', () => {
        const onChange = vi.fn()
        const rows: Row[] = [
            { id: '1', name: 'A', value: 10 },
            { id: '2', name: 'B', value: 20 },
        ]
        const { result } = renderHook(() => useFieldUpdate(rows, onChange))

        act(() => result.current.removeRow('1'))
        expect(onChange).toHaveBeenCalledWith([
            { id: '2', name: 'B', value: 20 },
        ])
    })

    it('does not mutate the original array', () => {
        const onChange = vi.fn()
        const rows: Row[] = [{ id: '1', name: 'A', value: 10 }]
        const { result } = renderHook(() => useFieldUpdate(rows, onChange))

        act(() => result.current.updateField('1', 'value', 99 as any))
        expect(rows[0].value).toBe(10)
    })
})

// ============================================================================
// DeleteRowButton
// ============================================================================

describe('DeleteRowButton', () => {
    it('calls onClick when clicked', () => {
        const onClick = vi.fn()
        render(<DeleteRowButton onClick={onClick} isVisible={true} />)
        fireEvent.click(screen.getByTitle('Eliminar'))
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('is invisible when isVisible=false', () => {
        const { container } = render(<DeleteRowButton onClick={() => {}} isVisible={false} />)
        const btn = container.querySelector('button')!
        expect(btn.className).toContain('opacity-0')
    })

    it('is visible when isVisible=true', () => {
        const { container } = render(<DeleteRowButton onClick={() => {}} isVisible={true} />)
        const btn = container.querySelector('button')!
        expect(btn.className).toContain('opacity-100')
    })
})

// ============================================================================
// ViewSourceButton
// ============================================================================

describe('ViewSourceButton', () => {
    it('renders nothing without sourceFileId', () => {
        const { container } = render(
            <ViewSourceButton onViewSource={() => {}} isVisible={true} />
        )
        expect(container.innerHTML).toBe('')
    })

    it('renders nothing without onViewSource', () => {
        const { container } = render(
            <ViewSourceButton sourceFileId="f1" isVisible={true} />
        )
        expect(container.innerHTML).toBe('')
    })

    it('calls onViewSource with array-wrapped id', () => {
        const onViewSource = vi.fn()
        render(
            <ViewSourceButton sourceFileId="f1" onViewSource={onViewSource} isVisible={true} />
        )
        fireEvent.click(screen.getByTitle('Ver documento fuente'))
        expect(onViewSource).toHaveBeenCalledWith(['f1'])
    })
})
