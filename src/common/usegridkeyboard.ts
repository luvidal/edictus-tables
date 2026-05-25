import { useState, useCallback, useRef, useEffect } from 'react'

export interface GridFocusedCell {
    rowId: string
    cellKey: string
}

export interface GridStop {
    rowId: string
    cellKey: string
    ref: React.RefObject<HTMLElement | null>
}

interface UseGridKeyboardProps {
    /** Ordered list of visible row IDs */
    visibleRowIds: string[]
}

/**
 * A request to start editing a specific cell. `n` is a monotonic counter so
 * consumers can distinguish "second Enter on the same cell" from the first.
 * Scoping by (rowId, cellKey) prevents the request from being consumed by a
 * cell that wasn't the user's target — see the `editTrigger` regression where
 * tabbing into a sibling cell whose `effectiveEditTrigger` snapped 0→N caused
 * unintended edits / data loss.
 */
export interface GridEditRequest {
    rowId: string
    cellKey: string
    initialValue: string | null
    n: number
}

export interface GridClearRequest {
    rowId: string
    cellKey: string
    n: number
}

export interface GridKeyboard {
    focusedCell: GridFocusedCell | null
    /** Cell-scoped edit request — `null` until the user triggers an edit. */
    editRequest: GridEditRequest | null
    /** Cell-scoped clear request — `null` until the user presses Delete/Backspace. */
    clearRequest: GridClearRequest | null
    isFocused: (rowId: string, cellKey: string) => boolean
    focus: (rowId: string, cellKey: string) => void
    clearFocus: () => void
    navigate: (direction: 'up' | 'down' | 'left' | 'right') => void
    register: (stop: GridStop) => () => void
    handleContainerKeyDown: (e: React.KeyboardEvent) => void
}

export const useGridKeyboard = ({ visibleRowIds }: UseGridKeyboardProps): GridKeyboard => {
    const [focusedCell, setFocusedCell] = useState<GridFocusedCell | null>(null)
    const [editRequest, setEditRequest] = useState<GridEditRequest | null>(null)
    const [clearRequest, setClearRequest] = useState<GridClearRequest | null>(null)

    const focusedCellRef = useRef(focusedCell)
    useEffect(() => { focusedCellRef.current = focusedCell }, [focusedCell])

    const visibleRowIdsRef = useRef(visibleRowIds)
    useEffect(() => { visibleRowIdsRef.current = visibleRowIds }, [visibleRowIds])

    // Per-row registry of focusable stops. Order resolved at navigate-time via
    // compareDocumentPosition so visibility flips don't scramble traversal.
    const registryRef = useRef<Map<string, GridStop[]>>(new Map())

    const register = useCallback((stop: GridStop) => {
        const list = registryRef.current.get(stop.rowId)
        if (list) {
            // Dev-only warning: two cells colliding on (rowId, cellKey) means
            // `findIndex(s => s.cellKey === cur.cellKey)` will only ever resolve
            // to the first one — the second is in the DOM tab chain but
            // unreachable via cellKey-based navigation. Usually a column-config
            // typo. Skip in production to avoid console noise.
            if (process.env.NODE_ENV !== 'production' && list.some(s => s.cellKey === stop.cellKey)) {
                console.warn(
                    `[useGridKeyboard] Duplicate stop registration: rowId="${stop.rowId}" cellKey="${stop.cellKey}". ` +
                    `Only the first stop is reachable via cellKey lookups (arrow up/down, focus()). ` +
                    `Check for a repeated column key or a stale registration.`,
                )
            }
            list.push(stop)
        } else {
            registryRef.current.set(stop.rowId, [stop])
        }
        return () => {
            const cur = registryRef.current.get(stop.rowId)
            if (!cur) return
            const next = cur.filter(s => s !== stop)
            if (next.length === 0) registryRef.current.delete(stop.rowId)
            else registryRef.current.set(stop.rowId, next)
        }
    }, [])

    const getOrderedStops = useCallback((rowId: string): GridStop[] => {
        const list = registryRef.current.get(rowId)
        if (!list || list.length === 0) return []
        const alive = list.filter(s => s.ref.current != null)
        alive.sort((a, b) => {
            const ar = a.ref.current!
            const br = b.ref.current!
            if (ar === br) return 0
            const pos = ar.compareDocumentPosition(br)
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
            return 0
        })
        return alive
    }, [])

    const isFocused = useCallback((rowId: string, cellKey: string) => {
        return focusedCell?.rowId === rowId && focusedCell?.cellKey === cellKey
    }, [focusedCell])

    const focus = useCallback((rowId: string, cellKey: string) => {
        setFocusedCell({ rowId, cellKey })
    }, [])

    const clearFocus = useCallback(() => setFocusedCell(null), [])

    const focusStop = useCallback((stop: GridStop) => {
        stop.ref.current?.focus()
        setFocusedCell({ rowId: stop.rowId, cellKey: stop.cellKey })
    }, [])

    const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        const cur = focusedCellRef.current
        if (!cur) return
        const rowIds = visibleRowIdsRef.current
        const rowIdx = rowIds.indexOf(cur.rowId)
        if (rowIdx === -1) return

        const stops = getOrderedStops(cur.rowId)
        const colIdx = stops.findIndex(s => s.cellKey === cur.cellKey)

        switch (direction) {
            case 'right': {
                if (colIdx >= 0 && colIdx < stops.length - 1) {
                    focusStop(stops[colIdx + 1])
                } else {
                    // wrap to first stop of the next row that has any stops
                    for (let i = rowIdx + 1; i < rowIds.length; i++) {
                        const next = getOrderedStops(rowIds[i])
                        if (next.length > 0) { focusStop(next[0]); break }
                    }
                }
                break
            }
            case 'left': {
                if (colIdx > 0) {
                    focusStop(stops[colIdx - 1])
                } else {
                    for (let i = rowIdx - 1; i >= 0; i--) {
                        const prev = getOrderedStops(rowIds[i])
                        if (prev.length > 0) { focusStop(prev[prev.length - 1]); break }
                    }
                }
                break
            }
            case 'down': {
                // Same cellKey in the next row that registers it, else stay.
                for (let i = rowIdx + 1; i < rowIds.length; i++) {
                    const next = getOrderedStops(rowIds[i])
                    if (next.length === 0) continue
                    const same = next.find(s => s.cellKey === cur.cellKey)
                    if (same) focusStop(same)
                    return
                }
                break
            }
            case 'up': {
                for (let i = rowIdx - 1; i >= 0; i--) {
                    const prev = getOrderedStops(rowIds[i])
                    if (prev.length === 0) continue
                    const same = prev.find(s => s.cellKey === cur.cellKey)
                    if (same) focusStop(same)
                    return
                }
                break
            }
        }
    }, [focusStop, getOrderedStops])

    /** Handle keydown on the table container (for arrow keys when not editing) */
    const handleContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!focusedCellRef.current) return

        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault()
                navigate('up')
                break
            case 'ArrowDown':
                e.preventDefault()
                navigate('down')
                break
            case 'ArrowLeft':
                e.preventDefault()
                navigate('left')
                break
            case 'ArrowRight':
                e.preventDefault()
                navigate('right')
                break
            case 'Tab':
                e.preventDefault()
                navigate(e.shiftKey ? 'left' : 'right')
                break
            case 'Enter':
            case 'F2': {
                e.preventDefault()
                const cur = focusedCellRef.current
                if (!cur) return
                setEditRequest(prev => ({
                    rowId: cur.rowId,
                    cellKey: cur.cellKey,
                    initialValue: null,
                    n: (prev?.n ?? 0) + 1,
                }))
                break
            }
            case 'Delete':
            case 'Backspace': {
                e.preventDefault()
                const cur = focusedCellRef.current
                if (!cur) return
                setClearRequest(prev => ({
                    rowId: cur.rowId,
                    cellKey: cur.cellKey,
                    n: (prev?.n ?? 0) + 1,
                }))
                break
            }
            case 'Escape':
                e.preventDefault()
                clearFocus()
                break
            default: {
                // Type-to-edit: single printable character starts editing with that char
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault()
                    const cur = focusedCellRef.current
                    if (!cur) return
                    setEditRequest(prev => ({
                        rowId: cur.rowId,
                        cellKey: cur.cellKey,
                        initialValue: e.key,
                        n: (prev?.n ?? 0) + 1,
                    }))
                }
                break
            }
        }
    }, [navigate, clearFocus])

    return {
        focusedCell,
        editRequest,
        clearRequest,
        isFocused,
        focus,
        clearFocus,
        navigate,
        register,
        handleContainerKeyDown,
    }
}
