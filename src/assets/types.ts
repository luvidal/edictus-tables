import type { SoftDeletable } from '../common/softdeletetypes'
import type { AutoConvertRule, AutoComputeRule, SideEffect } from '../common/autoconvert'
import type { ColorScheme } from '../common/colors'

export type AssetRow = { id: string } & SoftDeletable & Record<string, unknown>

export interface ColumnDef {
    key: string
    label: string
    type: 'text' | 'currency' | 'number' | 'percent'
    /** Column width hint (e.g. '30%') — applied on <th>, browser distributes proportionally */
    width?: string
    align?: 'left' | 'right' | 'center'
    placeholder?: string
    isLabel?: boolean
    /** Key of the paired UF/CLP field shown when currency toggle switches */
    ufPair?: string
    /** Label to show when toggled to the paired field (default: auto-swap UF↔$) */
    ufPairLabel?: string
    /** Type of the paired field (default: 'currency') */
    ufPairType?: 'currency' | 'number'
    /** Return class to apply when cell value is auto-computed */
    autoComputedClass?: (row: Record<string, unknown>) => string
    /** Two fields rendered as "X / Y" (e.g. cuotas fraction) */
    compound?: {
        key: string           // Second field key
        separator?: string    // Default: " / "
    }
    /** Per-row cell visibility — false renders "—" instead of cell */
    visible?: (row: Record<string, unknown>) => boolean
    /** Per-cell hover tooltip */
    tooltip?: (row: Record<string, unknown>) => string | null
    /** Per-row read-only condition — true renders display-only */
    readOnly?: (row: Record<string, unknown>) => boolean
    /** Inline EditableField pill — renders pill in front of this column's display value.
     *  `key` is the row field for the pill value; the column's own value becomes `displayValue`. */
    field?: { key: string; min?: number; max?: number; symbol?: string; defaultValue?: number }
    /** Row field key that holds the source file ID for this column's value — shows Eye icon on hover */
    sourceFileIdKey?: string
}

export interface AssetTableProps<T extends AssetRow = AssetRow> {
    columns: ColumnDef[]
    rows: T[]
    onRowsChange: (rows: T[]) => void
    idPrefix: string
    addPlaceholder?: string
    formatCurrency?: (value: number | null | undefined) => string
    colorScheme?: ColorScheme
    /** @deprecated Use colorScheme instead */
    headerBg?: string
    /** @deprecated Use colorScheme instead */
    headerText?: string
    title?: React.ReactNode
    /** UF value — enables UF/$ toggle when columns have ufPair */
    ufValue?: number | null
    /** Auto-conversion rules (UF↔CLP) */
    conversionRules?: AutoConvertRule[]
    /** Auto-compute rules */
    computeRules?: AutoComputeRule[]
    /** Side effects applied after conversions/compute */
    sideEffects?: SideEffect[]
    /** Callback to view source document — shows Eye icon on row hover */
    onViewSource?: (fileIds: string[]) => void
    getCellOriginClass?: (rowId: string, colKey: string) => string | undefined
    /** Enable row selection (checkboxes + bulk delete) */
    selectable?: boolean
    /** Enable drag-to-reorder rows */
    reorderable?: boolean
}

/**
 * Bundles all config for a CrudTable instance.
 * Jogi defines one per table type; CrudTable spreads it as props.
 */
export interface TablePreset {
    idPrefix: string
    addPlaceholder?: string
    columns: ColumnDef[]
    conversionRules?: AutoConvertRule[]
    computeRules?: AutoComputeRule[]
    sideEffects?: SideEffect[]
    selectable?: boolean
    reorderable?: boolean
}
