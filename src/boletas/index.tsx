import { displayCurrencyCompact } from '../common/utils'
import { T } from '../common/styles'
import { resolveColors } from '../common/colors'
import TableShell, { SourceIcon } from '../common/tableshell'
import ClickableHeader from '../common/clickableheader'

// ============================================================================
// Types
// ============================================================================

export type BoletaMonth = {
    periodo: string       // "2025-01"
    mes: string           // "enero"
    hasData: boolean
    boletas: number | null
    bruto: number | null
    retencion: number | null
    liquido: number | null
}

export interface BoletasTableProps {
    title: string
    months: BoletaMonth[]
    totales?: {
        boletas_vigentes?: number
        honorario_bruto?: number
        retencion_terceros?: number
        retencion_contribuyente?: number
        total_liquido?: number
    }
    colorScheme?: import('../common/colors').ColorScheme
    /** @deprecated Use colorScheme instead */
    headerBg?: string
    /** @deprecated Use colorScheme instead */
    headerText?: string
    sourceFileIds?: string[]
    onViewSource?: (fileIds: string[]) => void
    onRemoveMonth?: (periodo: string) => void
    /** Periodos excluded from summary calculations — columns are dimmed and clickable to toggle */
    excludedMonths?: string[]
    onToggleMonth?: (periodo: string) => void
    /** Toggle all months at once (year-level select/deselect) */
    onToggleAll?: () => void
    getCellOriginClass?: (metricKey: string, periodo: string) => string | undefined
}

// ============================================================================
// Short month labels for column headers
// ============================================================================

const SHORT_MONTHS: Record<string, string> = {
    enero: 'Ene', febrero: 'Feb', marzo: 'Mar', abril: 'Abr',
    mayo: 'May', junio: 'Jun', julio: 'Jul', agosto: 'Ago',
    septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dic',
}

// ============================================================================
// Detail rows (collapsible body)
// ============================================================================

type MetricKey = 'boletas' | 'bruto' | 'retencion'

const METRICS: { key: MetricKey; label: string; color: string; format: (v: number | null) => string }[] = [
    { key: 'bruto',     label: 'Honor. Bruto', color: 'text-ink-primary',   format: v => displayCurrencyCompact(v) },
    { key: 'retencion', label: 'Retención',    color: 'text-status-pending', format: v => displayCurrencyCompact(v) },
    { key: 'boletas',   label: 'Boletas Vig.', color: 'text-ink-primary',   format: v => v != null ? String(v) : '—' },
]

// ============================================================================
// Component
// ============================================================================

const BoletasTable = ({
    title,
    months,
    colorScheme: colorSchemeProp,
    headerBg: headerBgProp,
    headerText: headerTextProp,
    sourceFileIds,
    onViewSource,
    excludedMonths,
    onToggleMonth,
    onToggleAll,
    getCellOriginClass,
}: BoletasTableProps) => {
    const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp)
    const excluded = excludedMonths ?? []
    const allExcluded = months.length > 0 && months.every(m => excluded.includes(m.periodo))

    return (
        <TableShell
            headerBg={headerBg}
            renderHeader={() => (
                <>
                    <td className={`${T.headerAccordion} text-left ${T.vline} ${allExcluded ? 'opacity-35' : ''}`}>
                        <div className="flex items-center gap-2">
                            <ClickableHeader onClick={onToggleAll} borderColor={borderColor}>
                                <span className={`${headerText} ${T.headerTitle}`}>{title}</span>
                            </ClickableHeader>
                            <SourceIcon fileIds={sourceFileIds} onViewSource={onViewSource} className={headerText} />
                        </div>
                    </td>
                    {months.map(m => {
                        const isExcluded = excluded.includes(m.periodo)
                        const canToggle = !!onToggleMonth
                        const hasValue = m.hasData && m.liquido != null
                        const label = SHORT_MONTHS[m.mes] || (m.mes.charAt(0).toUpperCase() + m.mes.slice(1, 3))
                        return (
                            <td
                                key={m.periodo}
                                className={`${T.headerAccordionStat} ${isExcluded ? 'opacity-35 line-through' : ''}`}
                            >
                                <ClickableHeader onClick={canToggle ? () => onToggleMonth!(m.periodo) : undefined} borderColor={borderColor}>
                                    <span className={`${headerText} ${T.headerStatLabel}`}>{label}</span>
                                    <span className={`${T.headerStat} ${hasValue ? headerText : 'text-ink-tertiary'}`}>
                                        {hasValue ? displayCurrencyCompact(m.liquido) : '—'}
                                    </span>
                                </ClickableHeader>
                            </td>
                        )
                    })}
                </>
            )}
        >
            {METRICS.map(metric => (
                <tr key={metric.key} className={T.rowBorder}>
                    <td className={`${T.cell} font-medium ${T.cellLabel} text-ink-secondary ${T.vline}`}>
                        {metric.label}
                    </td>
                    {months.map(m => {
                        const isExcluded = excluded.includes(m.periodo)
                        return (
                            <td
                                key={m.periodo}
                                className={`${T.cell} text-right ${m.hasData ? (getCellOriginClass?.(metric.key, m.periodo) || metric.color) : 'text-ink-tertiary/60'} ${isExcluded ? 'opacity-35' : ''}`}
                            >
                                {m.hasData ? metric.format(m[metric.key]) : '—'}
                            </td>
                        )
                    })}
                </tr>
            ))}
        </TableShell>
    )
}

export default BoletasTable
