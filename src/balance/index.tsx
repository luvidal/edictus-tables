/**
 * BalanceTable — One card per company:
 *   - Header: company name + RUT (left), Del/al dates (right)
 *   - Table: column headers + two data rows (Empresa 100%, Participación X%)
 */

import React from 'react'
import { Eye } from 'lucide-react'
import { T } from '../common/styles'
import { resolveColors } from '../common/colors'
import { displayCurrencyCompact } from '../common/utils'
import EditableCell from '../common/editablecell'
import EditableField from '../common/editablefield'
import { useGridKeyboard } from '../common/usegridkeyboard'
import { useRowHover } from '../common/userowhover'
import { ORIGIN_CLASSES } from '../common/cellorigin'
import type { BalanceRow, BalanceTableProps } from './types'

const CURRENCY_KEYS: (keyof BalanceRow)[] = [
    'total_activos', 'total_pasivos', 'patrimonio',
    'total_ingresos', 'total_gastos', 'resultado',
]

const COL_HEADERS = [
    { label: '' },
    { label: 'Activos' },
    { label: 'Pasivos' },
    { label: 'Patrimonio' },
    { label: 'Ingresos' },
    { label: 'Gastos' },
    { label: 'Resultado' },
]

const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDate(d: string): string {
    const [y, m] = d.split('-')
    return `${SHORT_MONTHS[parseInt(m, 10) - 1]} ${y}`
}

function parsePeriod(row: BalanceRow): { desde: string; hasta: string } | null {
    if (row.from_date && row.to_date) {
        return { desde: formatDate(row.from_date), hasta: formatDate(row.to_date) }
    }
    if (row.periodo) return { desde: '', hasta: row.periodo }
    return null
}

const BalanceTable = ({
    rows,
    onRowsChange,
    colorScheme: colorSchemeProp,
    onViewSource,
    getCellOriginClass,
}: BalanceTableProps) => {
    const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp)
    const { getHoverProps } = useRowHover()

    const rowIds = rows.map(r => r.id)
    const keyboard = useGridKeyboard({ visibleRowIds: rowIds })

    const handleChange = (rowIdx: number, key: keyof BalanceRow, value: number | string | null) => {
        const updated = [...rows]
        updated[rowIdx] = { ...updated[rowIdx], [key]: value }
        onRowsChange(updated)
    }

    if (rows.length === 0) {
        return (
            <div className="outline-none flex flex-col gap-3">
                <div>
                    <div className={`flex items-start justify-between gap-3 px-3 py-2 rounded-t ${headerBg} border-b ${borderColor}`}>
                        <div className={`text-xs font-semibold ${headerText} leading-snug`}>—</div>
                    </div>
                    <table className={`${T.table} border-b border-edge-subtle/20`}>
                        <thead>
                            <tr>
                                {COL_HEADERS.map((col, i) => (
                                    <th
                                        key={i}
                                        className={`${T.headerCell} ${T.th} ${i < COL_HEADERS.length - 1 ? T.vline : ''} ${i === 0 ? 'text-left w-14' : 'text-right'}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[0, 1].map(rowIdx => (
                                <tr key={rowIdx} className={rowIdx === 0 ? T.rowHover : T.rowBorder}>
                                    <td className={`${T.cellEdit} ${T.vline} text-center`}>
                                        <span className="text-xs tabular-nums text-ink-tertiary">—</span>
                                    </td>
                                    {CURRENCY_KEYS.map((key, i) => (
                                        <td
                                            key={key}
                                            className={`${T.cellValue} ${i < CURRENCY_KEYS.length - 1 ? T.vline : ''} text-ink-tertiary`}
                                        >
                                            —
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div onKeyDown={keyboard.handleContainerKeyDown} tabIndex={0} className="outline-none flex flex-col gap-3">
            {rows.map((row, rowIdx) => {
                const participacion = row.participacion ?? 0
                const period = parsePeriod(row)

                return (
                    <div key={row.id} className="group/row" {...getHoverProps(row.id)}>
                        {/* Company header */}
                        <div className={`flex items-start justify-between gap-3 px-3 py-2 rounded-t ${headerBg} border-b ${borderColor}`}>
                            <div className="min-w-0">
                                <div className={`text-xs font-semibold ${headerText} leading-snug flex items-center gap-1.5`}>
                                    {row.empresa || '—'}
                                    {row.sourceFileId && onViewSource && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onViewSource([row.sourceFileId!]) }}
                                            className="p-0.5 rounded hover:bg-surface-2/60 transition-all opacity-0 group-hover/row:opacity-100 cursor-pointer flex-shrink-0"
                                            title="Ver documento fuente"
                                        >
                                            <Eye size={12} className={headerText} />
                                        </button>
                                    )}
                                </div>
                                {row.rut && (
                                    <div className="text-[11px] text-ink-tertiary mt-0.5">
                                        <span className="text-ink-tertiary/70">RUT</span> {row.rut}
                                    </div>
                                )}
                            </div>
                            {period && (
                                <div className="flex-shrink-0 text-[11px] text-ink-tertiary">
                                    {period.desde ? `${period.desde} – ${period.hasta}` : period.hasta}
                                </div>
                            )}
                        </div>

                        {/* Data table */}
                        <table className={`${T.table} border-b border-edge-subtle/20`}>
                            <thead>
                                <tr>
                                    {COL_HEADERS.map((col, i) => (
                                        <th
                                            key={i}
                                            className={`${T.headerCell} ${T.th} ${i < COL_HEADERS.length - 1 ? T.vline : ''} ${i === 0 ? 'text-left w-28' : 'text-right'}`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Row 1: Company totals (100%) — editable */}
                                <tr className={T.rowHover}>
                                    <td className={`${T.cellEdit} ${T.vline} text-center`}>
                                        <span className="text-xs tabular-nums text-ink-primary">Empresa 100%</span>
                                    </td>
                                    {CURRENCY_KEYS.map(key => {
                                        const val = row[key] as number | null
                                        const isNeg = typeof val === 'number' && val < 0
                                        const isBold = key === 'patrimonio' || key === 'resultado'
                                        const isLast = key === 'resultado'
                                        return (
                                            <EditableCell
                                                key={key}
                                                value={val}
                                                onChange={(v) => handleChange(rowIdx, key, v)}
                                                type="currency"
                                                hasData={val != null}
                                                className={`${!isLast ? T.vline : ''} ${isNeg ? 'text-status-pending' : ''} ${isBold ? 'font-semibold' : ''}`}
                                                originClass={getCellOriginClass?.(row.id, key as string)}
                                                keyboard={keyboard}
                                                rowId={row.id}
                                                cellKey={key as string}
                                            />
                                        )
                                    })}
                                </tr>

                                {/* Row 2: Proportional share — computed */}
                                <tr className={T.rowBorder}>
                                    <td className={`${T.cellEdit} ${T.vline} text-center`}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-xs text-ink-tertiary">Participación</span>
                                            <EditableField
                                                value={participacion}
                                                onChange={(v) => handleChange(rowIdx, 'participacion', v)}
                                                type="percent"
                                                symbol="%"
                                                originClass={getCellOriginClass?.(row.id, 'participacion')}
                                                keyboard={keyboard}
                                                rowId={row.id}
                                                cellKey="participacion"
                                            />
                                        </div>
                                    </td>
                                    {CURRENCY_KEYS.map(key => {
                                        const val = row[key] as number | null
                                        const propVal = val != null && participacion > 0
                                            ? Math.round(val * participacion / 100)
                                            : null
                                        const isNeg = typeof propVal === 'number' && propVal < 0
                                        const isBold = key === 'patrimonio' || key === 'resultado'
                                        const isLast = key === 'resultado'
                                        return (
                                            <td
                                                key={key}
                                                className={`${T.cellValue} ${!isLast ? T.vline : ''} ${isNeg ? 'text-status-pending' : ORIGIN_CLASSES.calculated} ${isBold ? 'font-semibold' : ''}`}
                                            >
                                                {propVal != null ? displayCurrencyCompact(propVal) : '—'}
                                            </td>
                                        )
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )
            })}
        </div>
    )
}

export default BalanceTable
