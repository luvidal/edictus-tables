import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FoldVertical, X, Check, Trash2 } from 'lucide-react'

// ============================================================================
// Context menu (right-click on rows)
// ============================================================================

interface ContextMenuProps {
    x: number
    y: number
    canGroup: boolean
    selectedCount: number
    onGroup: () => void
    onDeleteSelected: () => void
    onCancel: () => void
    onClose: () => void
}

export const ContextMenu = ({ x, y, canGroup, selectedCount, onGroup, onDeleteSelected, onCancel, onClose }: ContextMenuProps) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', handle)
        document.addEventListener('keydown', handleKey)
        return () => {
            document.removeEventListener('mousedown', handle)
            document.removeEventListener('keydown', handleKey)
        }
    }, [onClose])

    // Adjust position to keep menu on screen
    useEffect(() => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        if (rect.right > window.innerWidth) {
            ref.current.style.left = `${window.innerWidth - rect.width - 8}px`
        }
        if (rect.bottom > window.innerHeight) {
            ref.current.style.top = `${window.innerHeight - rect.height - 8}px`
        }
    }, [])

    const menu = (
        <div
            ref={ref}
            className="fixed z-50 bg-surface-1 border border-edge-subtle/20 rounded-lg shadow-lg py-1 min-w-[180px] text-ink-primary print:hidden"
            style={{ left: x, top: y }}
        >
            <button
                onClick={() => { onGroup(); onClose() }}
                disabled={!canGroup}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 disabled:text-ink-tertiary/50 disabled:hover:bg-transparent"
            >
                <FoldVertical size={14} />
                Agrupar {selectedCount} filas
            </button>
            <button
                onClick={() => { onDeleteSelected(); onClose() }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 text-status-pending"
            >
                <Trash2 size={14} />
                Eliminar {selectedCount} fila{selectedCount !== 1 ? 's' : ''}
            </button>
            <button
                onClick={() => { onCancel(); onClose() }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 text-ink-secondary"
            >
                <X size={14} />
                Cancelar selección
            </button>
        </div>
    )

    if (typeof document !== 'undefined') {
        return createPortal(menu, document.body)
    }
    return menu
}

// ============================================================================
// Header selection bar (replaces month totals when rows are selected)
// ============================================================================

interface HeaderSelectionBarProps {
    selectedCount: number
    canGroup: boolean
    monthCount: number
    naming: boolean
    onNamingChange: (v: boolean) => void
    onGroup: (name: string) => void
    onDeleteSelected: () => void
    onCancel: () => void
    showVariableColumn?: boolean
    showClassificationColumns?: boolean
}

export const HeaderSelectionBar = ({ selectedCount, canGroup, monthCount, naming, onNamingChange, onGroup, onDeleteSelected, onCancel, showVariableColumn = false, showClassificationColumns = false }: HeaderSelectionBarProps) => {
    const [groupName, setGroupName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (naming && inputRef.current) {
            inputRef.current.focus()
        }
    }, [naming])

    // Reset when selection is cleared
    useEffect(() => {
        if (selectedCount === 0) {
            setGroupName('')
        }
    }, [selectedCount])

    const handleSubmit = () => {
        const name = groupName.trim()
        if (name) {
            onGroup(name)
            onNamingChange(false)
            setGroupName('')
        }
    }

    return (
        <td
            colSpan={monthCount + 2 + (showClassificationColumns ? 2 : showVariableColumn ? 1 : 0)}
            className="px-4 py-2.5"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-2">
                {naming ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nombre del grupo..."
                            className="text-xs border border-edge-subtle/30 bg-surface-0 text-ink-primary placeholder-ink-tertiary/60 rounded px-2 py-1 outline-none focus:border-status-ok focus:ring-1 focus:ring-status-ok w-44"
                            onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') handleSubmit()
                                if (e.key === 'Escape') { onNamingChange(false); setGroupName('') }
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!groupName.trim()}
                            className="p-1 rounded text-status-ok hover:bg-status-ok/15 disabled:text-ink-tertiary/50 disabled:hover:bg-transparent"
                            title="Confirmar"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => { onNamingChange(false); setGroupName('') }}
                            className="p-1 rounded text-ink-tertiary hover:bg-surface-2"
                            title="Cancelar"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <span className="text-xs text-ink-tertiary">
                            {selectedCount} fila{selectedCount !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => onNamingChange(true)}
                            disabled={!canGroup}
                            className="text-xs px-3 py-1 rounded-full bg-status-ok text-status-ok-contrast hover:bg-status-ok/80 disabled:bg-surface-2 disabled:text-ink-tertiary/60 disabled:cursor-not-allowed transition-colors"
                            title={!canGroup && selectedCount < 2 ? 'Selecciona al menos 2 filas' : !canGroup ? 'Solo puedes agrupar filas del mismo tipo' : 'Agrupar filas seleccionadas'}
                        >
                            Agrupar
                        </button>
                        <button
                            onClick={onDeleteSelected}
                            className="text-xs px-3 py-1 rounded-full text-status-pending hover:bg-status-pending/15 transition-colors flex items-center gap-1"
                            title="Eliminar filas seleccionadas"
                        >
                            <Trash2 size={12} />
                            Eliminar
                        </button>
                        <button
                            onClick={onCancel}
                            className="text-xs px-2 py-1 rounded-full text-ink-tertiary hover:bg-surface-2 transition-colors"
                        >
                            Cancelar
                        </button>
                    </>
                )}
            </div>
        </td>
    )
}
