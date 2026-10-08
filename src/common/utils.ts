// Currency formatting — inlined from the host's lib/reports/utils.ts

export const generateId = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

export const formatDeletedDate = (iso: string): string => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'hace un momento'
    if (diffMin < 60) return `hace ${diffMin} min`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `hace ${diffHrs}h`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `hace ${diffDays}d`
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export const MONTH_LABELS: Record<string, string> = {
    enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo', abril: 'Abril',
    mayo: 'Mayo', junio: 'Junio', julio: 'Julio', agosto: 'Agosto',
    septiembre: 'Septiembre', octubre: 'Octubre', noviembre: 'Noviembre', diciembre: 'Diciembre',
}

export const displayCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return ''
    return `$ ${value.toLocaleString('es-CL')}`
}

/**
 * Compact currency: rounds to nearest thousand and displays without decimals.
 * 1_393_231 → "$1.393", 539_000 → "$539", 150 → "$0"
 */
/**
 * Full currency with em-dash for null/undefined.
 * 1_500_000 → "$ 1.500.000", null → "—"
 */
export const defaultFormatCurrency = (value: number | null | undefined): string => {
    if (value === undefined || value === null) return '—'
    return `$ ${value.toLocaleString('es-CL')}`
}

export const displayCurrencyCompact = (value: number | undefined | null, isDeduction = false): string => {
    if (value === undefined || value === null) return '—'
    const abs = Math.abs(value)
    const sign = (isDeduction && value > 0) || value < 0 ? '-' : ''
    const thousands = Math.round(abs / 1000)
    return `${sign}$${thousands.toLocaleString('es-CL')}`
}
