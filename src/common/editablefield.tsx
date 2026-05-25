/**
 * EditableField V3 — a compact inline-editable pill with optional display value.
 *
 * DIRECTIVE: EditableField must always render NEXT TO the main value it modifies,
 * never in a separate column. Use `displayValue` to show the main value inline.
 *
 * Renders the entire interactive region — pill + symbol + display value — as one
 * clickable/hoverable unit. Single-click anywhere starts editing the pill.
 *
 * Use cases:
 *   Factor Avalúo: <EditableField value={2} onChange={...} displayValue="$167.794" />                              → [2 ×] $167.794
 *   Castigo:       <EditableField value={15} onChange={...} type="percent" symbol="%" displayValue="$800.000" />   → [15 %] $800.000
 *   MonthPill:     <EditableField value={8} onChange={...} symbol="m" displayValue="$4.5M" defaultValue={12} />    → [8 m] $4.5M
 */

import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react'
import type { GridKeyboard } from './usegridkeyboard'

interface EditableFieldProps {
    /** Current value of the editable field */
    value: number | null
    /** Called with new value after edit */
    onChange: (v: number) => void
    /** The main display value — rendered after the pill, read-only */
    displayValue?: ReactNode
    /** Default value — pill is hidden when value === defaultValue */
    defaultValue?: number
    /** Input type — defaults to 'number' */
    type?: 'percent' | 'number'
    /** Clamp range [min, max] */
    min?: number
    max?: number
    /** Symbol inside pill after value. Default "×". Pass null to hide. */
    symbol?: string | null
    /** Text color class based on cell origin */
    originClass?: string
    /** Fixed width for the wrapper (e.g. "120px", "8rem") */
    width?: string
    /** Extra Tailwind classes */
    className?: string
    /** Registry-path keyboard binding. When `keyboard`, `rowId`, and `cellKey` are
     *  all supplied, the outer wrapper registers a tab stop and Tab routes through
     *  `keyboard.navigate(...)`. Without it, Tab is handled natively. */
    keyboard?: GridKeyboard
    rowId?: string
    cellKey?: string
}

export default function EditableField({
    value,
    onChange,
    displayValue,
    defaultValue,
    type = 'number',
    min = 0,
    max = 100,
    symbol = '×',
    originClass,
    width,
    className = '',
    keyboard,
    rowId,
    cellKey,
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    // Guards commitEdit against double-fire — see EditableCell for context.
    const committingRef = useRef(false)

    const useRegistry = !!(keyboard && rowId && cellKey)

    // Stable register reference (useCallback([]) inside the hook), so the effect
    // doesn't churn when the parent re-renders.
    const register = keyboard?.register

    useEffect(() => {
        if (!useRegistry || !register) return
        return register({
            rowId: rowId!,
            cellKey: cellKey!,
            ref: wrapperRef as React.RefObject<HTMLElement | null>,
        })
    }, [useRegistry, register, rowId, cellKey])

    // Container handles arrow/Enter/F2/type-to-edit by setting a cell-scoped
    // `editRequest`. We only consume requests whose target matches THIS cell —
    // otherwise tabbing into a sibling would inherit the previous cell's edit
    // request and silently enter edit mode here.
    const cellFocused = useRegistry ? keyboard!.isFocused(rowId!, cellKey!) : false
    const editRequest = useRegistry ? keyboard!.editRequest : null
    const editRequestForMe = useRegistry && editRequest
        && editRequest.rowId === rowId && editRequest.cellKey === cellKey
        ? editRequest
        : null

    const hidden = defaultValue != null && value === defaultValue

    const startEdit = (initialValue?: string) => {
        committingRef.current = false
        setEditValue(initialValue ?? value?.toString() ?? '')
        setIsEditing(true)
    }

    // useLayoutEffect so the editRequest → startEdit → input mount → focus
    // chain completes before paint. See EditableCell for the dropped-keystroke
    // failure mode this prevents.
    useLayoutEffect(() => {
        if (editRequestForMe && !isEditing) {
            startEdit(editRequestForMe.initialValue ?? undefined)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editRequestForMe?.n])

    useLayoutEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // Type-to-edit puts a single char into the input — cursor at end.
            // Click/F2 puts the existing value in — select all for overwrite.
            if (editValue.length <= 1) {
                const len = inputRef.current.value.length
                inputRef.current.setSelectionRange(len, len)
            } else {
                inputRef.current.select()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    const commitEdit = () => {
        if (committingRef.current) return
        committingRef.current = true
        const inputStillFocused = document.activeElement === inputRef.current
        setIsEditing(false)
        const parsed = type === 'percent'
            ? parseFloat(editValue)
            : parseInt(editValue, 10)
        if (editValue !== '' && !isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, Math.round(parsed)))
            if (clamped !== value) onChange(clamped)
        }
        // Keep focus on the cell in the tab chain after the input unmounts;
        // navigate() in the caller may immediately move it elsewhere.
        if (useRegistry && inputStillFocused) {
            wrapperRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitEdit()
            if (useRegistry) keyboard!.navigate('down')
        } else if (e.key === 'Tab') {
            if (useRegistry) {
                e.preventDefault()
                commitEdit()
                keyboard!.navigate(e.shiftKey ? 'left' : 'right')
            }
            // else: native Tab — let the browser move focus; onBlur fires commitEdit.
        } else if (e.key === 'Escape') {
            committingRef.current = true
            setIsEditing(false)
        }
    }

    const handleClick = () => {
        if (!isEditing) {
            if (useRegistry) keyboard!.focus(rowId!, cellKey!)
            startEdit()
        }
    }

    return (
        <div
            ref={useRegistry ? wrapperRef : undefined}
            tabIndex={useRegistry ? 0 : undefined}
            className={`group/field flex items-center gap-1.5 rounded-md cursor-pointer
                hover:bg-surface-1/60 transition-colors ${useRegistry ? 'outline-none' : ''} ${className}`}
            style={width ? { width } : undefined}
            onClick={handleClick}
            // Seed logical focus so the container catches Enter/F2/printable
            // keys for this cell after a native Tab into the wrapper.
            onFocus={useRegistry ? () => keyboard!.focus(rowId!, cellKey!) : undefined}
        >
            {/* DIRECTIVE: bg-blue-50/50 is the signature light-blue pill color — do not remove or change */}
            <div className={`
                shrink-0 relative inline-flex items-center gap-0.5 justify-center
                bg-blue-50/50 rounded-md py-0 px-1.5 h-5 text-xs min-w-[48px] text-center
                transition-opacity
                ${hidden ? 'opacity-30 group-hover/field:opacity-60 group-focus-within/field:!opacity-100' : ''}
            `}>
                {isEditing && (
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 rounded-md text-center text-xs tabular-nums text-ink-primary bg-transparent border-none outline-none ring-0 shadow-none px-1.5 z-10"
                        autoComplete="off"
                    />
                )}
                <span className={`tabular-nums ${isEditing ? 'invisible' : ''} text-ink-primary`}>
                    {value?.toString() ?? '—'}
                </span>
                {symbol && <span className={`text-ink-primary ${isEditing ? 'invisible' : ''}`}>{symbol}</span>}
            </div>
            {displayValue != null && (
                <span className={`text-xs tabular-nums whitespace-nowrap ml-auto text-ink-secondary ${originClass ?? ''}`}>{displayValue}</span>
            )}
        </div>
    )
}
