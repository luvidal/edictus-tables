import React from 'react'
import { Eye } from 'lucide-react'
import EditableCell from '../common/editablecell'
import GridTextInput from '../common/gridtextinput'
import { T } from '../common/styles'
import RowToolbar from '../common/rowtoolbar'
import { isSubtractType } from './helpers'
import type { GridKeyboard } from '../common/usegridkeyboard'
import type { RowData, Month } from './types'

/**
 * Sentinel cellKey for the label column. Shared with `AddRow` so arrow up/down
 * lines up the label inputs across data and add rows.
 */
export const LABEL_CELL_KEY = '__label__'

type NaturalezaType = 'Imponible' | 'No imponible' | 'Legal' | 'Otro' | undefined

const naturalezaPill = (n: NaturalezaType): { label: string; style: string } => {
    switch (n) {
        case 'Imponible': return { label: 'IMP', style: 'bg-status-info/10 text-status-info border border-status-info/30' }
        case 'No imponible': return { label: 'NO IMP', style: 'bg-surface-1 text-ink-tertiary border border-edge-subtle/20' }
        case 'Legal': return { label: 'LEGAL', style: 'bg-status-ok/10 text-status-ok border border-status-ok/30' }
        case 'Otro': return { label: 'OTRO', style: 'bg-surface-1 text-ink-tertiary border border-edge-subtle/20' }
        default: return { label: '—', style: 'bg-surface-1 text-ink-tertiary/60 border border-edge-subtle/10' }
    }
}

const rentaPill = (isVariable: boolean | undefined, naturaleza: NaturalezaType): { label: string; style: string } => {
    if (naturaleza === 'Legal') return { label: '—', style: 'bg-surface-1 text-ink-tertiary/60 border border-edge-subtle/10' }
    return isVariable
        ? { label: 'RV', style: 'bg-status-warn/10 text-status-warn border border-status-warn/30' }
        : { label: 'RF', style: 'bg-status-info/10 text-status-info border border-status-info/30' }
}

const PILL = 'rounded-sm py-0.5 text-[9px] font-semibold cursor-pointer select-none transition-opacity hover:opacity-70 block leading-tight whitespace-nowrap text-center mx-auto px-1.5'

interface DataRowProps {
    row: RowData
    months: Month[]
    isHovered: boolean
    selected?: boolean
    anySelected?: boolean
    selectable?: boolean
    hoverProps: Record<string, unknown>
    onRemove: () => void
    onToggleSelect?: () => void
    onContextMenu?: (e: React.MouseEvent) => void
    onLabelChange: (label: string) => void
    onValueChange: (monthId: string, value: number | null) => void
    onViewSource?: (fileIds: string[]) => void
    /** Grid keyboard binding — the row registers its label + month cells. */
    keyboard?: GridKeyboard
    /** Variable column */
    showVariableColumn?: boolean
    onToggleVariable?: () => void
    /** Classification columns (Tipo + Renta) */
    showClassificationColumns?: boolean
    onToggleNaturaleza?: () => void
    /** Drag reorder: is this row being dragged */
    isDragging?: boolean
    /** Drag reorder: is this the drop target, and position */
    dropIndicator?: 'above' | 'below' | null
    /** Drag reorder: drag start handler */
    onDragStart?: (e: React.DragEvent) => void
    /** Drag reorder: drag over handler */
    onDragOver?: (e: React.DragEvent) => void
    /** Drag reorder: drag leave handler */
    onDragLeave?: () => void
    /** Drag reorder: drop handler */
    onDrop?: (e: React.DragEvent) => void
    /** Drag reorder: drag end handler */
    onDragEnd?: () => void
    /** Cell origin color class callback */
    getCellOriginClass?: (monthId: string) => string | undefined
}

const DataRow = ({
    row,
    months,
    isHovered,
    selected = false,
    anySelected = false,
    selectable = false,
    hoverProps,
    onRemove,
    onToggleSelect,
    onContextMenu,
    onLabelChange,
    onValueChange,
    onViewSource,
    keyboard,
    showVariableColumn = false,
    onToggleVariable,
    showClassificationColumns = false,
    onToggleNaturaleza,
    isDragging = false,
    dropIndicator,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    getCellOriginClass,
}: DataRowProps) => {
    const indented = !!row.groupId
    const subtract = isSubtractType(row.type)
    const rowBg = selected
        ? 'bg-status-ok/10'
        : row.isVariable
            ? (subtract ? 'bg-status-warn/10 hover:bg-status-warn/20' : 'bg-status-warn/5 hover:bg-status-warn/15')
            : (subtract ? 'bg-status-pending/10 hover:bg-status-pending/15' : 'hover:bg-surface-1/60')
    const dropBorder = dropIndicator === 'above' ? 'border-t-2 border-t-brand'
        : dropIndicator === 'below' ? 'border-b-2 border-b-brand' : ''

    const handleRowClick = (e: React.MouseEvent) => {
        if (!selectable || !onToggleSelect) return
        if (!(e.metaKey || e.ctrlKey)) return
        const target = e.target as HTMLElement
        if (target.closest('input, button, [role="button"]')) return
        e.preventDefault()
        onToggleSelect()
    }

    return (
        <tr
            className={`border-b border-edge-subtle/10 ${rowBg} ${isDragging ? 'opacity-40' : ''} ${dropBorder} group`}
            onClick={handleRowClick}
            {...hoverProps}
            onContextMenu={onContextMenu}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <td className={`${T.cellEditLabel} text-ink-secondary ${T.cellLabel} relative ${showClassificationColumns ? '' : T.vline}`}>
                <RowToolbar
                    hovered={isHovered}
                    anySelected={anySelected}
                    selected={selected}
                    reorderable={!!onDragStart}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    selectable={selectable}
                    onToggleSelect={onToggleSelect}
                    onDelete={onRemove}
                />
                <div className={`flex items-center gap-0.5 min-w-0 ${indented ? 'pl-4' : ''}`}>
                    {keyboard ? (
                        <GridTextInput
                            keyboard={keyboard}
                            rowId={row.id}
                            cellKey={LABEL_CELL_KEY}
                            value={row.label}
                            onChange={onLabelChange}
                            className={`flex-1 min-w-0 ${T.rowLabel}`}
                            title={row.label}
                        />
                    ) : (
                        <input
                            type="text"
                            value={row.label}
                            onChange={(e) => onLabelChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                            className={`flex-1 min-w-0 ${T.rowLabel}`}
                            title={row.label}
                        />
                    )}
                    {row.sourceFileId && onViewSource && (
                        <button
                            onClick={() => onViewSource([row.sourceFileId!])}
                            className={`p-1 rounded transition-all shrink-0 ${isHovered ? 'opacity-100 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2' : 'opacity-0'}`}
                            title="Ver documento fuente"
                        >
                            <Eye size={14} />
                        </button>
                    )}
                </div>
            </td>
            {showClassificationColumns && (() => {
                const tipo = naturalezaPill(row.naturaleza)
                const renta = rentaPill(row.isVariable, row.naturaleza)
                return (
                    <>
                        <td className={`${T.cellCompact} text-center`}
                            onClick={(e) => { e.stopPropagation(); onToggleNaturaleza?.() }}
                            title={`${row.naturaleza || 'Sin tipo'} — click para cambiar`}
                        >
                            <span className={`${PILL} ${tipo.style}`}>{tipo.label}</span>
                        </td>
                        <td className={`${T.cellCompact} text-center ${T.vline}`}
                            onClick={(e) => { e.stopPropagation(); if (row.naturaleza !== 'Legal') onToggleVariable?.() }}
                            title={row.naturaleza === 'Legal' ? 'Descuento legal' : row.isVariable ? 'Variable — click para cambiar a Fija' : 'Fija — click para cambiar a Variable'}
                        >
                            <span className={`${PILL} ${renta.style}`}>{renta.label}</span>
                        </td>
                    </>
                )
            })()}
            {showVariableColumn && !showClassificationColumns && (() => {
                const renta = rentaPill(row.isVariable, undefined)
                return (
                    <td className={`${T.cellCompact} text-center ${T.vline}`}
                        onClick={(e) => { e.stopPropagation(); onToggleVariable?.() }}
                        title={row.isVariable ? 'Variable — click para cambiar a Fija' : 'Fija — click para cambiar a Variable'}
                    >
                        <span className={`${PILL} ${renta.style}`}>{renta.label}</span>
                    </td>
                )
            })()}
            {months.map((p, mi) => {
                const vline = mi < months.length - 1 ? T.vline : ''
                return (
                    <EditableCell
                        key={p.id}
                        value={row.values[p.id] ?? null}
                        onChange={(v) => onValueChange(p.id, v as number | null)}
                        isDeduction={subtract}
                        hasData={row.values[p.id] !== undefined && row.values[p.id] !== null}
                        className={vline}
                        type="currency"
                        originClass={getCellOriginClass?.(p.id)}
                        onViewSource={p.sourceFileId && onViewSource ? () => onViewSource([p.sourceFileId!]) : undefined}
                        keyboard={keyboard}
                        rowId={row.id}
                        cellKey={p.id}
                    />
                )
            })}
            <td className={T.actionCol} aria-hidden />
        </tr>
    )
}

export default DataRow
