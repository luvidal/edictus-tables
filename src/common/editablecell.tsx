// EditableCell — inlined from jogi's components/forms/editablecell.tsx
// Replaced @/ imports with local package imports

import { useState, useRef, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { T } from './styles'
import { useIsMobile } from './usemobile'
import { displayCurrencyCompact, displayCurrency } from './utils'
import type { GridKeyboard } from './usegridkeyboard'

const parseCurrency = (value: string): number | null => {
    const cleaned = value.replace(/[^0-9-]/g, '')
    const num = parseInt(cleaned, 10)
    return isNaN(num) ? null : num
}

interface EditableCellProps {
    value: number | string | null | undefined
    onChange: (value: number | string | null) => void
    type?: 'text' | 'number' | 'currency' | 'percent'
    isDeduction?: boolean
    hasData?: boolean
    className?: string
    align?: 'left' | 'center' | 'right'
    placeholder?: string
    /** Callback to view source document - shows Eye icon on hover */
    onViewSource?: () => void
    /** Render as div instead of td (for non-table contexts) */
    asDiv?: boolean
    /**
     * @deprecated Pass `keyboard`/`rowId`/`cellKey` instead — the registry path
     * derives focus from the `useGridKeyboard` hook. Slated for removal in the
     * next major. Zero call sites in jogi/main as of 2026-05-25.
     */
    focused?: boolean
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    onCellFocus?: () => void
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    requestEdit?: number
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    requestClear?: number
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    editInitialValue?: string | null
    /** Text color class based on cell origin (ai/user/calculated). Overrides default text-ink-primary. */
    originClass?: string
    /** Registry-path keyboard binding. When `keyboard`, `rowId`, and `cellKey` are all
     *  supplied, this cell registers a tab stop and reads focus/edit/clear state from
     *  the keyboard. The legacy per-cell focus/onNavigate/requestEdit props are then
     *  ignored. Tab routes through `keyboard.navigate(...)`. */
    keyboard?: GridKeyboard
    rowId?: string
    cellKey?: string
}

/**
 * EditableCell - An inline-editable table cell
 *
 * Click to select (focus ring), double-click/Enter/F2/type to edit.
 * IMPORTANT: This component uses a fixed-size container to prevent layout shifts
 * when toggling between display and edit modes. The input is absolutely positioned
 * within a fixed-height container so clicking to edit does NOT scramble/shift
 * the table layout.
 */
const EditableCell = ({
    value,
    onChange,
    type = 'currency',
    isDeduction = false,
    hasData = true,
    className = '',
    align = 'right',
    placeholder = '',
    onViewSource,
    asDiv = false,
    focused = false,
    onCellFocus,
    onNavigate,
    requestEdit = 0,
    requestClear = 0,
    editInitialValue,
    originClass,
    keyboard,
    rowId,
    cellKey,
}: EditableCellProps) => {
    const isMobile = useIsMobile()
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const wrapperRef = useRef<HTMLElement | null>(null)
    // Guards commitEdit against double-fire when explicit commit (Enter/Tab) is
    // followed by the input's onBlur during the same event tick.
    const committingRef = useRef(false)

    const useRegistry = !!(keyboard && rowId && cellKey)

    // Extract register so the effect depends on the stable useCallback identity,
    // not the (unstable) parent `keyboard` object literal returned each render.
    const register = keyboard?.register

    // Register on mount when on the registry path
    useEffect(() => {
        if (!useRegistry || !register) return
        return register({ rowId: rowId!, cellKey: cellKey!, ref: wrapperRef })
    }, [useRegistry, register, rowId, cellKey])

    // Focus state — from registry when wired, else from legacy `focused` prop
    const cellFocused = useRegistry ? keyboard!.isFocused(rowId!, cellKey!) : focused
    const effectiveEditTrigger = useRegistry
        ? (cellFocused ? keyboard!.editTrigger : 0)
        : requestEdit
    const effectiveClearTrigger = useRegistry
        ? (cellFocused ? keyboard!.clearTrigger : 0)
        : requestClear
    const effectiveEditInitialValue = useRegistry
        ? (cellFocused ? keyboard!.editInitialValue : undefined)
        : editInitialValue

    const startEdit = (initialValue?: string) => {
        committingRef.current = false
        setEditValue(initialValue ?? value?.toString() ?? '')
        setIsEditing(true)
    }

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // For type-to-edit, place cursor at end; otherwise select all
            if (editValue.length <= 1) {
                // Single char from type-to-edit — cursor at end
                const len = inputRef.current.value.length
                inputRef.current.setSelectionRange(len, len)
            } else {
                inputRef.current.select()
            }
        }
    }, [isEditing])

    const commitEdit = () => {
        // Re-entrancy guard: explicit commit paths (Enter/Tab) call commitEdit
        // and then move DOM focus, which triggers the input's onBlur → another
        // commitEdit on the same tick. Short-circuit the second call.
        if (committingRef.current) return
        committingRef.current = true
        // Snapshot whether the input still owns DOM focus. If a navigate
        // already moved focus away (Tab/Enter then a sibling Tab stop), we
        // must NOT steal it back to this wrapper.
        const inputStillFocused = document.activeElement === inputRef.current
        setIsEditing(false)
        let newValue: number | string | null = editValue

        if (type === 'number') {
            newValue = editValue === '' ? null : parseInt(editValue, 10)
            if (typeof newValue === 'number' && isNaN(newValue)) newValue = null
        } else if (type === 'currency') {
            newValue = parseCurrency(editValue)
        } else if (type === 'percent') {
            newValue = editValue === '' ? null : parseFloat(editValue)
            if (typeof newValue === 'number' && isNaN(newValue)) newValue = null
        } else {
            newValue = editValue === '' ? null : editValue
        }

        // Call onChange if value changed
        // Note: using != to catch null/undefined differences
        if (newValue != value) {
            onChange(newValue)
        }

        // On the registry path, hand focus back to the wrapper so the cell
        // stays in the tab chain after the input unmounts. Skip when focus
        // already left the input (e.g. a follow-up navigate moved it).
        if (useRegistry && inputStillFocused) {
            wrapperRef.current?.focus()
        }
    }

    const cancelEdit = () => {
        // Block the imminent onBlur from re-running commitEdit and clobbering
        // the cancelled value.
        committingRef.current = true
        setIsEditing(false)
        setEditValue('')
    }

    const goNavigate = (direction: 'up' | 'down' | 'left' | 'right') => {
        if (useRegistry) keyboard!.navigate(direction)
        else onNavigate?.(direction)
    }

    const hasNavTarget = useRegistry || !!onNavigate

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitEdit()
            goNavigate('down')
        } else if (e.key === 'Tab') {
            if (hasNavTarget) {
                e.preventDefault()
                commitEdit()
                goNavigate(e.shiftKey ? 'left' : 'right')
            }
            // else: no grid wiring and no legacy navigate prop. Let native Tab
            // move focus while the input is still mounted (so the browser picks
            // the correct next tabbable); the input's onBlur fires commitEdit
            // after focus has left. FinalResults relies on this.
        } else if (e.key === 'Escape') {
            cancelEdit()
        }
    }

    // Format display value based on type
    const getDisplayValue = () => {
        if (type === 'currency') {
            return displayCurrencyCompact(value as number, isDeduction)
        }
        if (type === 'percent') {
            if (value === null || value === undefined) return '—'
            return `${value}%`
        }
        return value?.toString() || '—'
    }

    const displayValue = getDisplayValue()

    // Color classes based on state — priority: empty → deduction → origin → default
    const colorClass = !hasData
        ? 'text-ink-tertiary/60'
        : isDeduction && type === 'currency'
            ? 'text-status-pending'
            : (originClass || 'text-ink-primary')

    // Alignment classes
    const alignClass = align === 'left' ? 'text-left justify-start' : align === 'center' ? 'text-center justify-center' : 'text-right justify-end'
    const inputAlignClass = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'

    const Wrapper = asDiv ? 'div' : 'td'

    // Trigger edit externally (keyboard Enter/F2 or type-to-edit)
    useEffect(() => {
        if (effectiveEditTrigger > 0 && !isEditing) {
            startEdit(effectiveEditInitialValue ?? undefined)
        }
    }, [effectiveEditTrigger])

    // Trigger clear externally (keyboard Delete/Backspace)
    useEffect(() => {
        if (effectiveClearTrigger > 0) {
            onChange(null)
        }
    }, [effectiveClearTrigger])

    // Click to select (focus ring only), double-click to edit
    const handleClick = () => {
        if (!isEditing) {
            if (useRegistry) keyboard!.focus(rowId!, cellKey!)
            else onCellFocus?.()
        }
    }

    const handleDoubleClick = () => {
        if (!isEditing) {
            if (useRegistry) keyboard!.focus(rowId!, cellKey!)
            else onCellFocus?.()
            startEdit()
        }
    }

    const focusRing = cellFocused && !isEditing ? 'ring-2 ring-brand ring-inset' : ''

    return (
        <Wrapper
            ref={useRegistry ? (wrapperRef as React.RefObject<HTMLTableCellElement & HTMLDivElement>) : undefined}
            tabIndex={useRegistry ? 0 : undefined}
            className={`${T.cellEdit} cursor-pointer ${focusRing} ${useRegistry ? 'outline-none' : ''} ${className}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            // Seed logical focus when the wrapper receives DOM focus (native Tab
            // from outside the table, or any focus() call). Without this the
            // container's keyboard handler short-circuits on `!focusedCell` and
            // arrow/Enter/type-to-edit are silently dropped.
            onFocus={useRegistry ? () => keyboard!.focus(rowId!, cellKey!) : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`h-5 flex items-center ${alignClass} gap-1 relative`}>
                {isEditing && (
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode={type === 'currency' || type === 'number' ? 'numeric' : undefined}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className={`absolute inset-0 ${inputAlignClass} ${colorClass} text-xs tabular-nums bg-transparent border-none outline-none ring-0 shadow-none p-0 z-10`}
                        autoComplete="off"
                    />
                )}
                <span
                    className={`text-xs tabular-nums ${colorClass} ${!hasData ? 'text-ink-tertiary/60' : ''} ${isEditing ? 'invisible' : ''}`}
                    title={type === 'currency' && hasData ? displayCurrency(value as number) : undefined}
                >
                    {displayValue}
                </span>
                {onViewSource && (isMobile || isHovered) && !isEditing && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onViewSource()
                        }}
                        className={`p-0.5 rounded hover:bg-surface-2 transition-all shrink-0 ${isMobile ? 'opacity-100' : ''}`}
                        title="Ver documento fuente"
                    >
                        <Eye size={14} className="text-ink-tertiary" />
                    </button>
                )}
            </div>
        </Wrapper>
    )
}

export default EditableCell
