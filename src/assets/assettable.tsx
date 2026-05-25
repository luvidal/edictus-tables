import React, { useState, useMemo, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import EditableCell from '../common/editablecell'
import EditableField from '../common/editablefield'
import GridTextInput from '../common/gridtextinput'
import RowToolbar from '../common/rowtoolbar'
import { T } from '../common/styles'
import { resolveColors } from '../common/colors'
import TableShell from '../common/tableshell'
import { useRowHover } from '../common/userowhover'
import { useGridKeyboard } from '../common/usegridkeyboard'
import { applyAutoConversions, applyAutoCompute } from '../common/autoconvert'
import { defaultFormatCurrency, generateId } from '../common/utils'
import { useSoftDelete } from '../common/usesoftdelete'
import { useDragReorder } from '../common/usedragreorder'
import DeleteDialog from '../common/deletedialog'
import RecycleBin from '../common/recyclebin'
import ClickableHeader from '../common/clickableheader'
import { ORIGIN_CLASSES } from '../common/cellorigin'
import type { AssetRow, AssetTableProps, ColumnDef } from './types'

const ADD_ROW_ID = '__add__'

function AssetTable<T extends AssetRow>({
    columns,
    rows,
    onRowsChange,
    idPrefix,
    addPlaceholder,
    formatCurrency = defaultFormatCurrency,
    colorScheme: colorSchemeProp,
    headerBg: headerBgProp,
    headerText: headerTextProp,
    title,
    ufValue,
    conversionRules = [],
    computeRules = [],
    sideEffects = [],
    onViewSource,
    getCellOriginClass,
    selectable = false,
    reorderable = false,
}: AssetTableProps<T>) {
    const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp)
    const { getHoverProps, isHovered } = useRowHover()
    const [toggledCols, setToggledCols] = useState<Set<string>>(new Set())
    const { activeRows, deletedRows, deleteTargetId, requestDelete, confirmDelete, cancelDelete, restoreRow } = useSoftDelete(rows, onRowsChange)
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [newRowValues, setNewRowValues] = useState<Record<string, string>>({})
    const drag = useDragReorder()

    const anySelected = selectable && selectedRows.size > 0
    const canToggleCurrency = ufValue != null
    const hasAutoConvert = conversionRules.length > 0 || computeRules.length > 0 || sideEffects.length > 0

    const toggleColumn = (key: string) => {
        setToggledCols(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const resolvedColumns = useMemo(() => {
        return columns.map(col => {
            if (col.ufPair && toggledCols.has(col.key)) {
                const pairLabel = col.ufPairLabel || col.label
                const pairType = col.ufPairType || 'currency'
                return { ...col, key: col.ufPair, type: pairType as ColumnDef['type'], label: pairLabel }
            }
            return col
        })
    }, [columns, toggledCols])

    // Append a synthetic add-row id so Tab from the last data row's last cell
    // walks into the add row's first input.
    const visibleRowIds = useMemo(
        () => [...activeRows.map(r => r.id), ADD_ROW_ID],
        [activeRows],
    )
    const keyboard = useGridKeyboard({ visibleRowIds })

    const labelCol = resolvedColumns.find(c => c.isLabel) || resolvedColumns[0]

    // --- Selection ---
    const toggleSelect = useCallback((rowId: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(rowId)) next.delete(rowId)
            else next.add(rowId)
            return next
        })
    }, [])

    const clearSelection = useCallback(() => setSelectedRows(new Set()), [])

    const requestDeleteSelected = useCallback(() => {
        for (const id of selectedRows) requestDelete(id)
        clearSelection()
    }, [selectedRows, requestDelete, clearSelection])

    const handleRowClick = useCallback((e: React.MouseEvent, rowId: string) => {
        if (!(e.metaKey || e.ctrlKey)) return
        const target = e.target as HTMLElement
        if (target.closest('input, button, [role="button"]')) return
        e.preventDefault()
        toggleSelect(rowId)
    }, [toggleSelect])

    // --- Field update with conversions, compute, and side effects ---
    const updateField = (id: string, field: string, value: string | number | null) => {
        onRowsChange(rows.map(r => {
            if (r.id !== id) return r
            if (hasAutoConvert) {
                let next = applyAutoConversions(r, field, value, conversionRules, {})
                next = applyAutoCompute(next, field, computeRules, {})
                for (const effect of sideEffects) {
                    if (effect.trigger === field) {
                        next = { ...next, ...effect.apply(next, value) }
                    }
                }
                return next as T
            }
            return { ...r, [field]: value } as T
        }))
    }

    const addRow = (overrides?: Partial<T>) => {
        const base: Record<string, unknown> = { id: generateId(idPrefix) }
        for (const col of columns) {
            if (col.type === 'text') {
                base[col.key] = (newRowValues[col.key] || '').trim()
            } else {
                base[col.key] = null
            }
            if (col.ufPair) base[col.ufPair] = null
            if (col.compound) base[col.compound.key] = null
        }
        const row = { ...base, ...overrides } as T
        setNewRowValues({})
        onRowsChange([...rows, row])
    }

    // --- Totals ---
    const totals = useMemo(() => {
        const result: Record<string, number> = {}
        for (const col of resolvedColumns) {
            if (col.type === 'currency' || col.type === 'number') {
                result[col.key] = activeRows.reduce((s, r) => s + ((r[col.key] as number) || 0), 0)
            }
            if (col.compound) {
                result[col.compound.key] = activeRows.reduce((s, r) => s + ((r[col.compound!.key] as number) || 0), 0)
            }
        }
        return result
    }, [activeRows, resolvedColumns])

    // --- Cell helpers ---
    const cellOrigin = (row: T, key: string, col: ColumnDef): string | undefined => {
        if (col.autoComputedClass?.(row)) return ORIGIN_CLASSES.calculated
        return getCellOriginClass?.(row.id, key)
    }

    // --- Render ---
    return (<>
        <div onKeyDown={keyboard.handleContainerKeyDown} tabIndex={0} className="outline-none mb-4 sm:mb-6">
            <TableShell
                colorScheme={colorSchemeProp}
                headerClassName={`border-t ${borderColor} ${headerText}`}
                rowCount={activeRows.length}
                renderHeader={() => (
                    anySelected ? (
                        <th colSpan={resolvedColumns.length + 1} className={`${T.headerCell} text-left`} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-status-pending">
                                    {selectedRows.size} fila{selectedRows.size !== 1 ? 's' : ''}
                                </span>
                                <button
                                    onClick={requestDeleteSelected}
                                    className="text-xs px-3 py-1 rounded-full text-status-pending hover:bg-status-pending/15 transition-colors flex items-center gap-1"
                                    title="Eliminar filas seleccionadas"
                                >
                                    <Trash2 size={12} />
                                    Eliminar
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="text-xs px-2 py-1 rounded-full text-ink-tertiary hover:bg-surface-2 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </th>
                    ) : (
                        <>
                            {resolvedColumns.map((col, i) => {
                                const isNumeric = col.type === 'currency' || col.type === 'number'
                                const effectiveAlign = col.align ?? (isNumeric ? 'right' : col.type === 'percent' ? 'center' : 'left')
                                const vline = i < resolvedColumns.length - 1 ? T.vline : ''
                                const label = col === labelCol && title ? title : col.label
                                const origCol = columns[i]
                                const isToggleable = canToggleCurrency && origCol?.ufPair
                                return (
                                    <th
                                        key={col.key}
                                        style={col.width ? { width: col.width } : undefined}
                                        className={`${T.headerCell} ${effectiveAlign === 'right' ? 'text-right' : effectiveAlign === 'center' ? 'text-center' : 'text-left'} ${T.th} normal-case ${headerText} ${vline}`}
                                    >
                                        {isToggleable ? (
                                            <ClickableHeader onClick={() => toggleColumn(origCol.key)} borderColor={borderColor}>
                                                {label}
                                            </ClickableHeader>
                                        ) : label}
                                    </th>
                                )
                            })}
                            <th className={T.actionCol}></th>
                        </>
                    )
                )}
                renderFooter={() => (
                    <tr className="font-semibold text-xs text-ink-tertiary">
                        {resolvedColumns.map((col) => {
                            if (col.isLabel) {
                                return <td key={col.key} className={`${T.totalCell} ${T.totalLabel} border-t border-edge-subtle/10`}>TOTAL</td>
                            }
                            if (col.type === 'text') {
                                return <td key={col.key} className={`${T.totalCell} border-t border-edge-subtle/10`} />
                            }
                            if (col.type === 'percent') {
                                return <td key={col.key} className="border-t border-edge-subtle/10" />
                            }
                            if (col.compound) {
                                const sep = col.compound.separator ?? '/'
                                const v1 = totals[col.key]
                                const v2 = totals[col.compound.key]
                                return (
                                    <td key={col.key} className={`${T.totalCell} text-center ${T.totalValue} border-t border-edge-subtle/10`}>
                                        {(v1 || v2) ? `${v1 || 0} ${sep} ${v2 || 0}` : ''}
                                    </td>
                                )
                            }
                            return (
                                <td key={col.key} className={`${T.totalCell} ${col.align === 'center' ? 'text-center' : 'text-right'} ${T.totalValue} border-t border-edge-subtle/10`}>
                                    {totals[col.key] ? (
                                        col.type === 'number'
                                            ? totals[col.key].toLocaleString('es-CL', { maximumFractionDigits: 2 })
                                            : formatCurrency(totals[col.key])
                                    ) : ''}
                                </td>
                            )
                        })}
                        <td className="border-t border-edge-subtle/10"></td>
                    </tr>
                )}
                renderAfterContent={() => (
                    <RecycleBin
                        deletedRows={deletedRows}
                        getLabel={(r) => (r[labelCol.key] as string) || ''}
                        onRestore={restoreRow}
                        renderCells={(row) => {
                            const editableCols = resolvedColumns.filter(c => c.type !== 'text')
                            return (
                                <>
                                    {editableCols.map((col, i) => {
                                        if (col.compound) {
                                            const sep = col.compound.separator ?? '/'
                                            const v1 = row[col.key] as number | null
                                            const v2 = row[col.compound.key] as number | null
                                            return (
                                                <td key={col.key} className={`${T.totalCell} text-center tabular-nums ${i < editableCols.length - 1 ? T.vline : ''}`}>
                                                    <span className={`${T.totalValue} ${v1 != null || v2 != null ? 'text-ink-tertiary' : 'text-ink-tertiary/40'}`}>
                                                        {v1 != null || v2 != null ? `${v1 ?? '—'} ${sep} ${v2 ?? '—'}` : '—'}
                                                    </span>
                                                </td>
                                            )
                                        }
                                        const v = row[col.key] as number | null
                                        return (
                                            <td key={col.key} className={`${T.totalCell} text-right tabular-nums ${i < editableCols.length - 1 ? T.vline : ''}`}>
                                                <span className={`${T.totalValue} ${v != null ? 'text-ink-tertiary' : 'text-ink-tertiary/40'}`}>
                                                    {v != null ? (col.type === 'number' ? String(v) : col.type === 'percent' ? `${Math.round(v * 100)}%` : formatCurrency(v)) : '—'}
                                                </span>
                                            </td>
                                        )
                                    })}
                                    <td className={T.actionCol} />
                                </>
                            )
                        }}
                    />
                )}
            >
                {activeRows.map(row => {
                    const hovered = isHovered(row.id)
                    const selected = selectable && selectedRows.has(row.id)
                    const isDragging = reorderable && drag.dragRowId === row.id
                    const dropBorder = reorderable && drag.dropTargetId === row.id
                        ? drag.dropPosition === 'above' ? 'border-t-2 border-t-brand' : 'border-b-2 border-b-brand'
                        : ''
                    return (
                        <tr
                            key={row.id}
                            className={`${T.rowBorder} ${selected ? 'bg-status-pending/10' : T.rowHover} ${isDragging ? 'opacity-40' : ''} ${dropBorder}`}
                            {...getHoverProps(row.id)}
                            onClick={selectable ? (e) => handleRowClick(e, row.id) : undefined}
                            onDragOver={reorderable ? drag.handleDragOver(row.id) : undefined}
                            onDragLeave={reorderable ? drag.handleDragLeave : undefined}
                            onDrop={reorderable ? drag.handleDrop(rows, onRowsChange) : undefined}
                        >
                            {resolvedColumns.map((col, i) => {
                                const vline = i < resolvedColumns.length - 1 ? T.vline : ''

                                // --- Label column ---
                                if (col.isLabel) {
                                    return (
                                        <td key={col.key} className={`${T.cellEditLabel} ${T.cellLabel} ${vline} relative`}>
                                            <RowToolbar
                                                hovered={hovered}
                                                anySelected={anySelected}
                                                selected={selected}
                                                reorderable={reorderable}
                                                onDragStart={reorderable ? drag.handleDragStart(row.id) : undefined}
                                                onDragEnd={reorderable ? drag.handleDragEnd : undefined}
                                                selectable={selectable}
                                                onToggleSelect={selectable ? () => toggleSelect(row.id) : undefined}
                                                onDelete={() => requestDelete(row.id)}
                                                sourceFileId={(row as Record<string, unknown>).sourceFileId as string | undefined}
                                                onViewSource={onViewSource}
                                            />
                                            <div className="flex items-center gap-0.5 min-w-0">
                                                <GridTextInput
                                                    keyboard={keyboard}
                                                    rowId={row.id}
                                                    cellKey={col.key}
                                                    value={(row[col.key] as string) || ''}
                                                    onChange={v => updateField(row.id, col.key, v)}
                                                    className={`flex-1 min-w-0 ${T.inputLabel} !p-0 ${getCellOriginClass?.(row.id, col.key) || ''}`}
                                                    placeholder={col.placeholder || col.label}
                                                />
                                            </div>
                                        </td>
                                    )
                                }

                                // --- Text column ---
                                if (col.type === 'text') {
                                    // Honor per-row visibility/readOnly predicates before
                                    // rendering the input — otherwise hidden/read-only text
                                    // columns would still register a tab stop.
                                    if (col.visible && !col.visible(row)) {
                                        return (
                                            <td key={col.key} className={`${T.cellEdit} text-center ${vline}`}>
                                                <span className="text-[11px] text-ink-tertiary/60">—</span>
                                            </td>
                                        )
                                    }
                                    if (col.readOnly?.(row)) {
                                        const v = (row[col.key] as string) || ''
                                        return (
                                            <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                                <div className={`text-xs ${getCellOriginClass?.(row.id, col.key) || 'text-ink-primary'}`}>
                                                    {v || '—'}
                                                </div>
                                            </td>
                                        )
                                    }
                                    const isRight = col.align === 'right'
                                    const isCenter = col.align === 'center'
                                    const textAlign = isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                                    return (
                                        <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                            <GridTextInput
                                                keyboard={keyboard}
                                                rowId={row.id}
                                                cellKey={col.key}
                                                value={(row[col.key] as string) || ''}
                                                onChange={v => updateField(row.id, col.key, v)}
                                                className={`w-full ${T.input} ${textAlign} ${!isRight && !isCenter ? 'pl-1' : ''} ${getCellOriginClass?.(row.id, col.key) || ''}`}
                                                style={isRight || isCenter ? { padding: 0 } : undefined}
                                                placeholder={col.placeholder || col.label}
                                            />
                                        </td>
                                    )
                                }

                                // --- Conditional visibility ---
                                if (col.visible && !col.visible(row)) {
                                    return (
                                        <td key={col.key} className={`${T.cellEdit} text-center ${vline}`}>
                                            <span className="text-[11px] text-ink-tertiary/60">—</span>
                                        </td>
                                    )
                                }

                                // --- Read-only (with optional inline field pill) ---
                                if (col.readOnly?.(row)) {
                                    const v = row[col.key] as number | null
                                    const isNumeric = col.type === 'currency' || col.type === 'number'
                                    const effectiveAlign = col.align ?? (isNumeric ? 'right' : 'center')
                                    const alignCls = effectiveAlign === 'left' ? 'justify-start' : effectiveAlign === 'center' ? 'justify-center' : 'justify-end'
                                    const displayStr = v != null ? (col.type === 'number' ? String(v) : formatCurrency(v)) : '—'

                                    if (col.field && v != null) {
                                        const f = col.field
                                        return (
                                            <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                                <EditableField
                                                    value={row[f.key] as number | null}
                                                    onChange={v => updateField(row.id, f.key, v)}
                                                    displayValue={displayStr}
                                                    defaultValue={f.defaultValue}
                                                    symbol={f.symbol ?? '×'}
                                                    min={f.min ?? 0}
                                                    max={f.max ?? 99}
                                                    originClass={cellOrigin(row, f.key, col)}
                                                    className={alignCls}
                                                    keyboard={keyboard}
                                                    rowId={row.id}
                                                    cellKey={f.key}
                                                />
                                            </td>
                                        )
                                    }

                                    return (
                                        <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                            <div className={`h-5 flex items-center ${alignCls} text-xs tabular-nums text-ink-primary`}>
                                                {displayStr}
                                            </div>
                                        </td>
                                    )
                                }

                                // --- Compound column (two EditableCells with separator) ---
                                if (col.compound) {
                                    const sep = col.compound.separator ?? '/'
                                    return (
                                        <td key={col.key} className={`text-center text-xs text-ink-tertiary ${vline}`}>
                                            <div className="flex items-center justify-center gap-0.5">
                                                <EditableCell
                                                    value={row[col.key] as number | null}
                                                    onChange={v => updateField(row.id, col.key, v as number | null)}
                                                    type={col.type as 'currency' | 'number'}
                                                    hasData={(row[col.key] as number | null) !== null}
                                                    align="center"
                                                    originClass={cellOrigin(row, col.key, col)}
                                                    asDiv
                                                    keyboard={keyboard}
                                                    rowId={row.id}
                                                    cellKey={col.key}
                                                />
                                                <span className="text-ink-tertiary">{sep}</span>
                                                <EditableCell
                                                    value={row[col.compound.key] as number | null}
                                                    onChange={v => updateField(row.id, col.compound!.key, v as number | null)}
                                                    type={col.type as 'currency' | 'number'}
                                                    hasData={(row[col.compound.key] as number | null) !== null}
                                                    align="center"
                                                    originClass={cellOrigin(row, col.compound.key, col)}
                                                    asDiv
                                                    keyboard={keyboard}
                                                    rowId={row.id}
                                                    cellKey={col.compound.key}
                                                />
                                            </div>
                                        </td>
                                    )
                                }

                                // --- Percent column (stored as decimal, displayed as integer %) ---
                                if (col.type === 'percent') {
                                    const rawValue = row[col.key] as number | null
                                    const displayValue = rawValue != null ? Math.round(rawValue * 100) : null
                                    return (
                                        <EditableCell
                                            key={col.key}
                                            value={displayValue}
                                            onChange={v => updateField(row.id, col.key, v != null ? (v as number) / 100 : null)}
                                            type="percent"
                                            hasData={displayValue !== null}
                                            align={col.align || 'center'}
                                            className={vline}
                                            originClass={cellOrigin(row, col.key, col)}
                                            keyboard={keyboard}
                                            rowId={row.id}
                                            cellKey={col.key}
                                        />
                                    )
                                }

                                // --- Regular editable cell (currency / number) ---
                                const value = row[col.key] as number | null
                                const cellSourceFileId = col.sourceFileIdKey ? (row as Record<string, unknown>)[col.sourceFileIdKey] as string | undefined : undefined
                                const cellViewSource = cellSourceFileId && onViewSource ? () => onViewSource([cellSourceFileId]) : undefined
                                const tip = col.tooltip?.(row)
                                if (tip) {
                                    return (
                                        <td key={col.key} className={vline} title={tip}>
                                            <EditableCell
                                                value={value}
                                                onChange={v => updateField(row.id, col.key, v as number | null)}
                                                type={col.type as 'currency' | 'number'}
                                                hasData={value !== null}
                                                align={col.align}
                                                originClass={cellOrigin(row, col.key, col)}
                                                onViewSource={cellViewSource}
                                                asDiv
                                                keyboard={keyboard}
                                                rowId={row.id}
                                                cellKey={col.key}
                                            />
                                        </td>
                                    )
                                }
                                return (
                                    <EditableCell
                                        key={col.key}
                                        value={value}
                                        onChange={v => updateField(row.id, col.key, v as number | null)}
                                        type={col.type as 'currency' | 'number'}
                                        hasData={value !== null}
                                        align={col.align}
                                        className={vline}
                                        originClass={cellOrigin(row, col.key, col)}
                                        onViewSource={cellViewSource}
                                        keyboard={keyboard}
                                        rowId={row.id}
                                        cellKey={col.key}
                                    />
                                )
                            })}
                            <td className={T.actionCol} aria-hidden />
                        </tr>
                    )
                })}

                {/* Add row */}
                <tr className={`border-b border-dashed ${borderColor.replace('200', '100')} ${headerBg}/20`}>
                    {resolvedColumns.map((col, i) => {
                        const vline = i < resolvedColumns.length - 1 ? T.vline : ''
                        if (col.isLabel) {
                            return (
                                <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                    <GridTextInput
                                        keyboard={keyboard}
                                        rowId={ADD_ROW_ID}
                                        cellKey={col.key}
                                        value={newRowValues[col.key] || ''}
                                        onChange={v => setNewRowValues(prev => ({ ...prev, [col.key]: v }))}
                                        placeholder={addPlaceholder || `Agregar...`}
                                        className={`w-full ${T.inputPlaceholder}`}
                                        onEnter={() => { if ((newRowValues[col.key] || '').trim()) addRow() }}
                                    />
                                </td>
                            )
                        }
                        if (col.type === 'text') {
                            const isAddRight = col.align === 'right'
                            const isAddCenter = col.align === 'center'
                            const addTextAlign = isAddRight ? 'text-right' : isAddCenter ? 'text-center' : 'text-left'
                            return (
                                <td key={col.key} className={`${T.cellEdit} ${vline}`}>
                                    <GridTextInput
                                        keyboard={keyboard}
                                        rowId={ADD_ROW_ID}
                                        cellKey={col.key}
                                        value={newRowValues[col.key] || ''}
                                        onChange={v => setNewRowValues(prev => ({ ...prev, [col.key]: v }))}
                                        placeholder={col.placeholder || col.label}
                                        className={`w-full ${T.inputPlaceholder} ${addTextAlign}`}
                                        style={isAddRight || isAddCenter ? { padding: 0 } : undefined}
                                    />
                                </td>
                            )
                        }
                        if (col.compound || col.type === 'percent') {
                            return <td key={col.key} className={vline}></td>
                        }
                        return (
                            <EditableCell
                                key={col.key}
                                value={null}
                                onChange={v => addRow({ [col.key]: v } as Partial<T>)}
                                type={col.type as 'currency' | 'number'}
                                hasData={false}
                                align={col.align}
                                className={vline}
                                keyboard={keyboard}
                                rowId={ADD_ROW_ID}
                                cellKey={col.key}
                            />
                        )
                    })}
                    <td className={T.actionCol}></td>
                </tr>
            </TableShell>
        </div>
        {deleteTargetId && <DeleteDialog count={1} onConfirm={confirmDelete} onCancel={cancelDelete} />}
    </>)
}

export default AssetTable
