import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { T } from '../common/styles'
import { resolveColors } from '../common/colors'
import TableShell, { SourceIcon } from '../common/tableshell'
import {
    generateLastNMonths,
    defaultFormatValue,
    defaultCalculateTotal,
    isAddType,
    isSubtractType,
    rowMatchesSection,
    getOrderedItems,
    createGroup,
    ungroupRows,
    autoUngroup,
    softDeleteRows,
    restoreRows,
    computeSectionSubtotal,
    computeRentaVariable,
} from './helpers'
import DataRow from './datarow'
import AddRow from './addrow'
import GroupRow from './grouprow'
import DeleteDialog from '../common/deletedialog'
import RecycleBin from '../common/recyclebin'
import { HeaderSelectionBar, ContextMenu } from './floatingaction'
import { useKeyboard } from './usekeyboard'
import { useDragReorder } from './usedragreorder'
import { useRowHover } from '../common/userowhover'

import type { RowData, RentaTableProps, ReliquidacionBreakdown } from './types'

// ============================================================================
// Reliquidación info tooltip
// ============================================================================

const fmtK = (v: number) => {
    const sign = v < 0 ? '-' : ''
    const abs = Math.abs(v)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}k`
    return `${sign}$${abs}`
}

const ReliqInfoTooltip = ({ data, type }: { data: ReliquidacionBreakdown; type: 'fija' | 'variable' }) => {
    const lines = type === 'fija'
        ? [
            { label: 'Imponible fijo', value: data.imponibleFijo, sign: '+' as const },
            { label: 'No imponible fijo', value: data.noImponibleFijo, sign: '+' as const },
            { label: 'Cotiz. previsional', value: data.cotizPreviFija, sign: '-' as const },
            { label: 'Cotiz. salud', value: data.cotizSaludFija, sign: '-' as const },
            { label: 'Cotiz. cesantía', value: data.cotizCesantiaFija, sign: '-' as const },
            { label: 'Impuesto (IUSC)', value: data.impuestoFijo, sign: '-' as const },
            { label: 'Otros desc. fijos', value: data.descuentosOtrosFijos, sign: '-' as const },
        ]
        : [
            { label: 'Líquido total', value: data.liquidoTotal, sign: '+' as const },
            { label: 'Renta fija', value: data.rentaFija, sign: '-' as const },
        ]

    const result = type === 'fija' ? data.rentaFija : data.rentaVariable
    const isFija = type === 'fija'

    return (
        <div className="hidden group-hover/reliq:block absolute bottom-full left-0 mb-2 z-50">
            <div className="bg-surface-1 text-ink-secondary text-[11px] rounded-lg shadow-lg border border-edge-subtle/20 px-3 py-2.5 whitespace-nowrap">
                <table className="border-spacing-0 w-full">
                    <tbody>
                        <tr>
                            <td colSpan={2} className={`pb-1.5 font-semibold text-[11px] text-left ${isFija ? 'text-status-info' : 'text-status-warn'}`}>
                                {isFija ? 'Cálculo Renta Fija' : 'Cálculo Renta Variable'}
                            </td>
                        </tr>
                        {lines.filter(l => l.value !== 0).map((l, i) => (
                            <tr key={i}>
                                <td className="pr-4 py-0.5 text-ink-tertiary text-left">{l.label}</td>
                                <td className="text-right py-0.5 tabular-nums text-ink-secondary">
                                    {l.sign === '-' ? '−' : '+'}{fmtK(l.value)}
                                </td>
                            </tr>
                        ))}
                        <tr className={`border-t ${isFija ? 'border-status-info/30' : 'border-status-warn/30'}`}>
                            <td className={`pr-4 pt-1.5 font-semibold text-left ${isFija ? 'text-status-info' : 'text-status-warn'}`}>
                                {isFija ? 'Renta Fija' : 'Renta Variable'}
                            </td>
                            <td className={`text-right pt-1.5 font-semibold tabular-nums ${isFija ? 'text-status-info' : 'text-status-warn'}`}>
                                {fmtK(result)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================================================
// Component
// ============================================================================

const RentaTable = ({
    title,
    months = 6,
    rows,
    onRowsChange,
    sections,
    colorScheme: colorSchemeProp,
    headerBg: headerBgProp,
    headerText: headerTextProp,
    forceExpanded = false,
    formatValue = defaultFormatValue,
    calculateTotal = defaultCalculateTotal,
    showVariableColumn = false,
    showClassificationColumns = false,
    sourceFileIds,
    onViewSource,
    reliquidacion,
    getCellOriginClass,
}: RentaTableProps) => {
    const { bg: headerBg, text: headerText } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp)
    const { getHoverProps, isHovered: isRowHovered } = useRowHover()
    const [newRowLabels, setNewRowLabels] = useState<Record<string, string>>({})
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [naming, setNaming] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Set<string> | null>(null)

    const monthsArray = useMemo(() => {
        if (typeof months === 'number') return generateLastNMonths(months)
        return months
    }, [months])

    const effectiveSections = useMemo(() => {
        if (sections) return sections
        const hasIncome = rows.some(r => r.type === 'income')
        const hasDeduction = rows.some(r => r.type === 'deduction')
        const hasDebt = rows.some(r => r.type === 'debt')
        const hasAdd = rows.some(r => r.type === 'add')
        const hasSubtract = rows.some(r => r.type === 'subtract')

        const result: Array<{ type: typeof rows[0]['type']; placeholder: string }> = []
        if (hasIncome || hasAdd) result.push({ type: hasIncome ? 'income' : 'add', placeholder: 'Agregar ingreso...' })
        if (hasDeduction) result.push({ type: 'deduction', placeholder: 'Agregar descuento...' })
        if (hasDebt) result.push({ type: 'debt', placeholder: 'Agregar deuda...' })
        if (hasSubtract && !hasDeduction && !hasDebt) result.push({ type: 'subtract', placeholder: 'Agregar descuento...' })
        if (result.length === 0) result.push({ type: 'add', placeholder: 'Agregar fila...' })
        return result
    }, [sections, rows])

    const anySelected = selectedRows.size > 0

    // Compute visible row IDs for keyboard navigation
    const visibleRowIds = useMemo(() => {
        const ids: string[] = []
        for (const section of effectiveSections) {
            const items = getOrderedItems(rows, section.type)
            for (const item of items) {
                if (item.kind === 'group') {
                    // Group headers are not navigable (read-only sums)
                    const showChildren = forceExpanded || !item.group.collapsed
                    if (showChildren) {
                        for (const child of item.children) ids.push(child.id)
                    }
                } else {
                    ids.push(item.row.id)
                }
            }
        }
        return ids
    }, [effectiveSections, rows, forceExpanded])

    const keyboard = useKeyboard({ visibleRowIds, monthCount: monthsArray.length })
    const drag = useDragReorder()

    // Auto-expand collapsed group headers when dragging over them for 600ms
    const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (expandTimerRef.current) { clearTimeout(expandTimerRef.current); expandTimerRef.current = null }
        if (!drag.dropTargetId || forceExpanded) return
        const target = rows.find(r => r.id === drag.dropTargetId)
        if (!target?.isGroup || !target.collapsed) return
        expandTimerRef.current = setTimeout(() => toggleGroupCollapse(target.id), 600)
        return () => { if (expandTimerRef.current) { clearTimeout(expandTimerRef.current); expandTimerRef.current = null } }
    }, [drag.dropTargetId]) // eslint-disable-line react-hooks/exhaustive-deps

    // ========================================================================
    // Selection logic
    // ========================================================================

    const toggleSelect = useCallback((rowId: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(rowId)) next.delete(rowId)
            else next.add(rowId)
            return next
        })
    }, [])

    const clearSelection = useCallback(() => setSelectedRows(new Set()), [])

    // Can group: 2+ selected, all same type family, none are group headers
    const canGroup = useMemo(() => {
        if (selectedRows.size < 2) return false
        const selected = rows.filter(r => selectedRows.has(r.id))
        if (selected.some(r => r.isGroup)) return false
        const types = new Set(selected.map(r => isAddType(r.type) ? 'add' : 'subtract'))
        return types.size === 1
    }, [selectedRows, rows])

    const handleGroup = useCallback((name: string) => {
        const newRows = createGroup(rows, selectedRows, name)
        onRowsChange(newRows)
        clearSelection()
        setNaming(false)
    }, [rows, selectedRows, onRowsChange, clearSelection])

    const handleContextMenu = useCallback((e: React.MouseEvent, rowId: string) => {
        if (!selectedRows.has(rowId) || selectedRows.size < 2) return
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
    }, [selectedRows])

    const startGroupNaming = useCallback(() => {
        setContextMenu(null)
        setNaming(true)
    }, [])

    // ========================================================================
    // Row management
    // ========================================================================

    const updateRowLabel = useCallback((rowId: string, label: string) => {
        onRowsChange(rows.map(r => r.id === rowId ? { ...r, label } : r))
    }, [rows, onRowsChange])

    const updateRowValue = useCallback((rowId: string, monthId: string, value: number | null) => {
        onRowsChange(rows.map(r => {
            if (r.id !== rowId) return r
            return { ...r, values: { ...r.values, [monthId]: value } }
        }))
    }, [rows, onRowsChange])

    const requestDelete = useCallback((rowId: string) => {
        const row = rows.find(r => r.id === rowId)
        if (!row) return
        if (row.isGroup) {
            // Group headers ungroup immediately (no recycle bin)
            onRowsChange(ungroupRows(rows, rowId))
            return
        }
        setDeleteTarget(new Set([rowId]))
    }, [rows, onRowsChange])

    const requestDeleteSelected = useCallback(() => {
        setDeleteTarget(new Set(selectedRows))
    }, [selectedRows])

    const confirmDelete = useCallback((reason: string) => {
        if (!deleteTarget) return
        const newRows = softDeleteRows(rows, deleteTarget, reason)
        onRowsChange(newRows)
        clearSelection()
        setDeleteTarget(null)
    }, [rows, deleteTarget, onRowsChange, clearSelection])

    const handleRestore = useCallback((rowId: string) => {
        onRowsChange(restoreRows(rows, new Set([rowId])))
    }, [rows, onRowsChange])

    const deletedRows = useMemo(() =>
        rows.filter(r => r.deletedAt && !r.isGroup),
    [rows])

    const toggleGroupCollapse = useCallback((groupId: string) => {
        onRowsChange(rows.map(r => r.id === groupId ? { ...r, collapsed: !r.collapsed } : r))
    }, [rows, onRowsChange])

    const handleUngroup = useCallback((groupId: string) => {
        onRowsChange(ungroupRows(rows, groupId))
    }, [rows, onRowsChange])

    const toggleVariable = useCallback((rowId: string) => {
        onRowsChange(rows.map(r => {
            if (r.id !== rowId) return r
            return { ...r, isVariable: !r.isVariable }
        }))
    }, [rows, onRowsChange])

    const toggleNaturaleza = useCallback((rowId: string) => {
        onRowsChange(rows.map(r => {
            if (r.id !== rowId) return r
            const isIncome = isAddType(r.type)
            const cycle: string[] = isIncome
                ? ['Imponible', 'No imponible']
                : ['Legal', 'Otro']
            // First click on undefined lands on cycle[0] so the user sees
            // — → IMP → NO IMP, not — → NO IMP (skipping IMP).
            const next = r.naturaleza
                ? cycle[(cycle.indexOf(r.naturaleza) + 1) % cycle.length]
                : cycle[0]
            return { ...r, naturaleza: next as RowData['naturaleza'] }
        }))
    }, [rows, onRowsChange])

    const addRow = useCallback((type: typeof rows[0]['type'], label: string) => {
        if (!label.trim()) return
        const newRow: RowData = { id: `row_${type}_${Date.now()}`, label: label.trim(), type, values: {} }
        setNewRowLabels(prev => ({ ...prev, [type]: '' }))

        if (isAddType(type)) {
            const subtractIndex = rows.findIndex(r => isSubtractType(r.type))
            if (subtractIndex === -1) {
                onRowsChange([...rows, newRow])
            } else {
                const updated = [...rows]
                updated.splice(subtractIndex, 0, newRow)
                onRowsChange(updated)
            }
        } else {
            onRowsChange([...rows, newRow])
        }
    }, [rows, onRowsChange])

    const addRowWithValue = useCallback((type: typeof rows[0]['type'], monthId: string, value: number | null) => {
        if (value === null) return
        const pendingLabel = (newRowLabels[type] || '').trim()
        const defaultLabel = isAddType(type) ? 'Nuevo ingreso' : 'Nuevo descuento'
        const newRow: RowData = { id: `row_${type}_${Date.now()}`, label: pendingLabel || defaultLabel, type, values: { [monthId]: value } }
        setNewRowLabels(prev => ({ ...prev, [type]: '' }))

        if (isAddType(type)) {
            const subtractIndex = rows.findIndex(r => isSubtractType(r.type))
            if (subtractIndex === -1) {
                onRowsChange([...rows, newRow])
            } else {
                const updated = [...rows]
                updated.splice(subtractIndex, 0, newRow)
                onRowsChange(updated)
            }
        } else {
            onRowsChange([...rows, newRow])
        }
    }, [rows, onRowsChange, newRowLabels])

    // ========================================================================
    // Render
    // ========================================================================

    const renderDataRow = (r: RowData) => (
        <DataRow
            key={r.id}
            row={r}
            months={monthsArray}
            isHovered={isRowHovered(r.id)}
            selected={selectedRows.has(r.id)}
            anySelected={anySelected}
            selectable={!r.isGroup}
            hoverProps={getHoverProps(r.id)}
            onRemove={() => requestDelete(r.id)}
            onToggleSelect={() => toggleSelect(r.id)}
            onContextMenu={(e) => handleContextMenu(e, r.id)}
            onLabelChange={(label) => updateRowLabel(r.id, label)}
            onValueChange={(monthId, value) => updateRowValue(r.id, monthId, value)}
            onViewSource={onViewSource}
            showVariableColumn={showVariableColumn}
            showClassificationColumns={showClassificationColumns}
            onToggleVariable={() => toggleVariable(r.id)}
            onToggleNaturaleza={() => toggleNaturaleza(r.id)}
            isCellFocused={(mi) => keyboard.isFocused(r.id, mi)}
            onCellFocus={(mi) => keyboard.focus(r.id, mi)}
            onNavigate={keyboard.navigate}
            editTrigger={keyboard.editTrigger}
            clearTrigger={keyboard.clearTrigger}
            editInitialValue={keyboard.editInitialValue}
            isDragging={drag.dragRowId === r.id}
            dropIndicator={drag.dropTargetId === r.id ? drag.dropPosition : null}
            onDragStart={drag.handleDragStart(r.id)}
            onDragOver={drag.handleDragOver(r.id)}
            onDragLeave={drag.handleDragLeave}
            onDrop={drag.handleDrop(rows, onRowsChange)}
            onDragEnd={drag.handleDragEnd}
            getCellOriginClass={getCellOriginClass ? (monthId) => getCellOriginClass(r.id, monthId) : undefined}
        />
    )

    return (
        <div
            tabIndex={0}
            onKeyDown={keyboard.handleContainerKeyDown}
            className="outline-none"
        >
            <TableShell
                headerBg={headerBg}
                renderHeader={() => (
                    anySelected ? (
                        <HeaderSelectionBar
                            selectedCount={selectedRows.size}
                            canGroup={canGroup}
                            monthCount={monthsArray.length}
                            naming={naming}
                            onNamingChange={setNaming}
                            onGroup={handleGroup}
                            onDeleteSelected={requestDeleteSelected}
                            onCancel={() => { clearSelection(); setNaming(false) }}
                            showVariableColumn={showVariableColumn}
                            showClassificationColumns={showClassificationColumns}
                        />
                    ) : (
                        <>
                            <td className={`${T.headerAccordion} text-left ${showClassificationColumns ? '' : T.vline}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`${headerText} ${T.headerTitle}`}>{title}</span>
                                    <SourceIcon fileIds={sourceFileIds} onViewSource={onViewSource} className={headerText} />
                                </div>
                            </td>
                            {showClassificationColumns && <><td className={`${T.cellCompact} text-center`}><span className={`${headerText} text-xs font-semibold opacity-60`}>Tipo</span></td><td className={`${T.cellCompact} text-center ${T.vline}`}><span className={`${headerText} text-xs font-semibold opacity-60`}>Renta</span></td></>}
                            {showVariableColumn && !showClassificationColumns && <td className={T.vline} />}
                            {monthsArray.map((p) => {
                                const total = calculateTotal(p.id, rows)
                                const hasValue = total !== 0
                                return (
                                    <td key={p.id} className={`${T.headerAccordionStat}`}>
                                        <span className={`${headerText} ${T.headerStatLabel} mr-1`}>{p.label}</span>
                                        <span className={`${T.headerStat} ${hasValue ? headerText : 'text-ink-tertiary'}`}>
                                            {hasValue ? formatValue(total) : '—'}
                                        </span>
                                    </td>
                                )
                            })}
                            <td className={T.actionCol} />
                        </>
                    )
                )}
                renderAfterContent={() => (
                    <>
                        <RecycleBin
                            deletedRows={deletedRows}
                            getLabel={(r) => r.label}
                            onRestore={handleRestore}
                            renderCells={(row) => {
                                const subtract = isSubtractType(row.type)
                                return (
                                    <>
                                        {showVariableColumn && <td className={T.vline} />}
                                        {monthsArray.map((m, mi) => {
                                            const v = row.values[m.id]
                                            const hasValue = v != null
                                            const vline = mi < monthsArray.length - 1 ? T.vline : ''
                                            return (
                                                <td key={m.id} className={`${T.cellEdit} text-right tabular-nums ${vline}`}>
                                                    <span className={`${T.totalValue} ${hasValue ? (subtract ? 'text-status-pending/70' : 'text-ink-tertiary') : 'text-ink-tertiary/50'}`}>
                                                        {hasValue ? formatValue(v) : '—'}
                                                    </span>
                                                </td>
                                            )
                                        })}
                                        <td className={T.actionCol} />
                                    </>
                                )
                            }}
                        />

                        {deleteTarget && (
                            <DeleteDialog
                                count={deleteTarget.size}
                                onConfirm={confirmDelete}
                                onCancel={() => setDeleteTarget(null)}
                            />
                        )}

                        {contextMenu && anySelected && (
                            <ContextMenu
                                x={contextMenu.x}
                                y={contextMenu.y}
                                canGroup={canGroup}
                                selectedCount={selectedRows.size}
                                onGroup={startGroupNaming}
                                onDeleteSelected={requestDeleteSelected}
                                onCancel={clearSelection}
                                onClose={() => setContextMenu(null)}
                            />
                        )}
                    </>
                )}
            >
                {effectiveSections.map((section) => {
                    const items = getOrderedItems(rows, section.type)
                    return (
                        <React.Fragment key={section.type}>
                            {items.map(item => {
                                if (item.kind === 'group') {
                                    const { group, children: groupChildren } = item
                                    const showChildren = forceExpanded || !group.collapsed
                                    return (
                                        <React.Fragment key={group.id}>
                                            <GroupRow
                                                group={group}
                                                childRows={groupChildren}
                                                months={monthsArray}
                                                isHovered={isRowHovered(group.id)}
                                                forceExpanded={forceExpanded}
                                                formatValue={formatValue}
                                                hoverProps={getHoverProps(group.id)}
                                                onToggleCollapse={() => toggleGroupCollapse(group.id)}
                                                onUngroup={() => handleUngroup(group.id)}
                                                onLabelChange={(label) => updateRowLabel(group.id, label)}
                                                showVariableColumn={showVariableColumn}
                                                showClassificationColumns={showClassificationColumns}
                                                isDragging={drag.dragRowId === group.id}
                                                dropIndicator={drag.dropTargetId === group.id ? drag.dropPosition : null}
                                                onDragStart={drag.handleDragStart(group.id)}
                                                onDragOver={drag.handleDragOver(group.id)}
                                                onDragLeave={drag.handleDragLeave}
                                                onDrop={drag.handleDrop(rows, onRowsChange)}
                                                onDragEnd={drag.handleDragEnd}
                                            />
                                            {showChildren && groupChildren.map(child => renderDataRow(child))}
                                        </React.Fragment>
                                    )
                                }
                                return renderDataRow(item.row)
                            })}
                            <AddRow
                                section={section}
                                months={monthsArray}
                                labelValue={newRowLabels[section.type] || ''}
                                onLabelChange={(v) => setNewRowLabels(prev => ({ ...prev, [section.type]: v }))}
                                onAddRow={(label) => addRow(section.type, label)}
                                onAddRowWithValue={(monthId, value) => addRowWithValue(section.type, monthId, value)}
                                showVariableColumn={showVariableColumn}
                                showClassificationColumns={showClassificationColumns}
                            />
                            {/* Subtotal row — below AddRow, only when table has multiple sections */}
                            {effectiveSections.length > 1 && (() => {
                                const subtotals = computeSectionSubtotal(rows, section.type, monthsArray)
                                const isSubtract = isSubtractType(section.type)
                                const label = isSubtract ? 'Total descuentos' : 'Total haberes'
                                return (
                                    <tr className={`${isSubtract ? 'bg-status-pending/5' : 'bg-status-ok/5'}`}>
                                        <td className={`${T.totalCell} border-b border-edge-subtle/10 ${showClassificationColumns ? '' : T.vline}`}>
                                            <span className="font-semibold text-xs text-ink-tertiary">{label}</span>
                                        </td>
                                        {showClassificationColumns && <><td className={`${T.cellCompact} border-b border-edge-subtle/10`} /><td className={`${T.cellCompact} border-b border-edge-subtle/10 ${T.vline}`} /></>}
                                        {showVariableColumn && !showClassificationColumns && <td className={`${T.cellCompact} border-b border-edge-subtle/10 ${T.vline}`} />}
                                        {monthsArray.map((p, mi) => {
                                            const value = subtotals[p.id] ?? 0
                                            const hasValue = value !== 0
                                            const display = isSubtract ? `-${formatValue(value)}` : formatValue(value)
                                            const vline = mi < monthsArray.length - 1 ? T.vline : ''
                                            return (
                                                <td key={p.id} className={`${T.totalCell} text-right border-b border-edge-subtle/10 ${vline}`}>
                                                    <span className={`font-semibold text-xs tabular-nums ${hasValue ? 'text-ink-tertiary' : 'text-ink-tertiary/50'}`}>
                                                        {hasValue ? display : '—'}
                                                    </span>
                                                </td>
                                            )
                                        })}
                                        <td className={`${T.actionCol} border-b border-edge-subtle/10`} />
                                    </tr>
                                )
                            })()}
                        </React.Fragment>
                    )
                })}
                {/* Summary rows — Renta Variable, Renta Fija */}
                {/* Uses reliquidación values when available (theoretical RF/RV split via effective-rate method), */}
                {/* otherwise falls back to naive method (sum of isVariable rows). */}
                {(showVariableColumn || showClassificationColumns) && effectiveSections.length > 1 && (() => {
                    const naiveVariable = computeRentaVariable(rows, monthsArray)
                    // formatValue strips negatives (displayCurrencyCompact uses Math.abs).
                    // Summary rows can be negative, so we prefix the sign manually.
                    const fmtSigned = (v: number) => v < 0 ? `-${formatValue(-v)}` : formatValue(v)
                    return (
                        <>
                            {/* Renta Variable */}
                            <tr className="border-b border-edge-subtle/10 bg-status-warn/5 group/rv">
                                <td className={`${T.totalCell} ${showClassificationColumns ? '' : T.vline}`}>
                                    <span className={`${T.totalLabel} text-status-warn`}>Renta Variable</span>
                                </td>
                                {showClassificationColumns && <><td className={T.cellCompact} /><td className={`${T.cellCompact} ${T.vline}`} /></>}
                                {showVariableColumn && !showClassificationColumns && <td className={`${T.cellCompact} text-center ${T.vline}`}><span className={T.empty}>—</span></td>}
                                {monthsArray.map((p, mi) => {
                                    const rliq = reliquidacion?.[p.id]
                                    const value = rliq ? rliq.rentaVariable : (naiveVariable[p.id] ?? 0)
                                    const hasValue = value !== 0
                                    const vline = mi < monthsArray.length - 1 ? T.vline : ''
                                    return (
                                        <td key={p.id} className={`${T.totalCell} text-right relative ${vline}`}>
                                            {rliq && hasValue && (
                                                <span className="group/reliq absolute cursor-help opacity-0 group-hover/rv:opacity-100 transition-opacity" style={{ top: '9px', left: '12px' }}>
                                                    <Info size={14} className="text-ink-tertiary hover:text-ink-secondary p-0.5 rounded hover:bg-surface-2" />
                                                    <ReliqInfoTooltip data={rliq} type="variable" />
                                                </span>
                                            )}
                                            <span className={`${T.totalValue} tabular-nums ${hasValue ? 'text-status-warn' : 'text-ink-tertiary/60'}`}>
                                                {hasValue ? fmtSigned(value) : '—'}
                                            </span>
                                        </td>
                                    )
                                })}
                                <td className={T.actionCol} />
                            </tr>
                            {/* Renta Fija */}
                            <tr className="border-b border-edge-subtle/10 bg-status-info/5 group/rf">
                                <td className={`${T.totalCell} ${showClassificationColumns ? '' : T.vline}`}>
                                    <span className={`${T.totalLabel} text-status-info`}>Renta Fija</span>
                                </td>
                                {showClassificationColumns && <><td className={T.cellCompact} /><td className={`${T.cellCompact} ${T.vline}`} /></>}
                                {showVariableColumn && !showClassificationColumns && <td className={`${T.cellCompact} text-center ${T.vline}`}><span className={T.empty}>—</span></td>}
                                {monthsArray.map((p, mi) => {
                                    const rliq = reliquidacion?.[p.id]
                                    const fija = rliq ? rliq.rentaFija : (calculateTotal(p.id, rows) - (naiveVariable[p.id] ?? 0))
                                    const hasValue = fija !== 0
                                    const vline = mi < monthsArray.length - 1 ? T.vline : ''
                                    return (
                                        <td key={p.id} className={`${T.totalCell} text-right relative ${vline}`}>
                                            {rliq && hasValue && (
                                                <span className="group/reliq absolute cursor-help opacity-0 group-hover/rf:opacity-100 transition-opacity" style={{ top: '9px', left: '12px' }}>
                                                    <Info size={14} className="text-ink-tertiary hover:text-ink-secondary p-0.5 rounded hover:bg-surface-2" />
                                                    <ReliqInfoTooltip data={rliq} type="fija" />
                                                </span>
                                            )}
                                            <span className={`${T.totalValue} tabular-nums ${hasValue ? 'text-status-info' : 'text-ink-tertiary/60'}`}>
                                                {hasValue ? fmtSigned(fija) : '—'}
                                            </span>
                                        </td>
                                    )
                                })}
                                <td className={T.actionCol} />
                            </tr>
                        </>
                    )
                })()}
            </TableShell>
        </div>
    )
}

export default RentaTable
