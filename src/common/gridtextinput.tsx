import { useRef, useEffect } from 'react'
import type { GridKeyboard } from './usegridkeyboard'

interface GridTextInputProps {
    keyboard: GridKeyboard
    rowId: string
    cellKey: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
    style?: React.CSSProperties
    title?: string
    /** Override Enter handling. Default: blur the input (legacy behavior). */
    onEnter?: () => void
}

/**
 * Plain text input that participates in the grid keyboard registry. Used for
 * label columns and free-text columns that should sit in the Tab chain
 * alongside two-mode editable cells (currency, numeric, percent).
 *
 * Tab → `keyboard.navigate(direction)`. Focus → `keyboard.focus(rowId, cellKey)`.
 * Enter → caller-supplied `onEnter`, else blur the input (matches the pre-registry
 * Renta-label behavior; numeric/percent grid cells navigate down on Enter via
 * EditableCell, but a label/text input committing on Enter shouldn't yank the
 * analyst into the next row's label).
 */
const GridTextInput = ({
    keyboard,
    rowId,
    cellKey,
    value,
    onChange,
    placeholder,
    className,
    style,
    title,
    onEnter,
}: GridTextInputProps) => {
    const ref = useRef<HTMLInputElement>(null)

    // Stable register reference — see EditableCell for context.
    const { register, focus, navigate } = keyboard

    useEffect(() => {
        return register({
            rowId,
            cellKey,
            ref: ref as React.RefObject<HTMLElement | null>,
        })
    }, [register, rowId, cellKey])

    return (
        <input
            ref={ref}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
            style={style}
            title={title}
            onFocus={() => focus(rowId, cellKey)}
            onKeyDown={e => {
                if (e.key === 'Tab') {
                    e.preventDefault()
                    navigate(e.shiftKey ? 'left' : 'right')
                } else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (onEnter) onEnter()
                    else (e.target as HTMLInputElement).blur()
                }
            }}
            autoComplete="off"
        />
    )
}

export default GridTextInput
