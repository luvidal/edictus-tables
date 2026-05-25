import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';

/**
 * ColorScheme — single source of truth for table section coloring.
 *
 * Consumers pass one `colorScheme` prop instead of separate headerBg/headerText.
 * The library applies it consistently to headers, footers, borders, and accents.
 *
 * Values are Tailwind class strings. Phase 2b migrated defaults to the unified
 * token palette (surface-*, ink-*, edge-*) owned by the host consumer. Legacy
 * callers passing raw Tailwind color literals (`bg-rose-50`) still work via the
 * headerBg/headerText path; the border derivation preserves the old regex.
 */
interface ColorScheme {
    /** Header/footer background — e.g. 'bg-surface-2' or legacy 'bg-rose-50' */
    bg: string;
    /** Header/footer text + icon color — e.g. 'text-ink-secondary' or legacy 'text-rose-700' */
    text: string;
    /** Section border — e.g. 'border-edge-subtle/20' or legacy 'border-rose-200' */
    border: string;
}
/** Neutral fallback when no scheme is provided — dark token palette. */
declare const DEFAULT_SCHEME: ColorScheme;
/**
 * Resolve color scheme from new `colorScheme` prop or legacy `headerBg`/`headerText`.
 * Priority: colorScheme > headerBg/headerText > defaultScheme
 */
declare function resolveColors(colorScheme?: ColorScheme, headerBg?: string, headerText?: string, defaultScheme?: ColorScheme): ColorScheme;

type RowType = 'add' | 'subtract' | 'income' | 'deduction' | 'debt';
type RowData = {
    id: string;
    label: string;
    type: RowType;
    values: Record<string, number | null>;
    sourceFileId?: string;
    isDefault?: boolean;
    groupId?: string;
    isGroup?: boolean;
    collapsed?: boolean;
    order?: number;
    isVariable?: boolean;
    naturaleza?: 'Imponible' | 'No imponible' | 'Legal' | 'Otro';
    legalType?: 'afp' | 'salud' | 'cesantia' | 'impuesto';
    deletedAt?: string;
    deletionReason?: string;
};
type Month = {
    id: string;
    label: string;
    sourceFileId?: string;
};
interface RentaTableProps {
    title: string;
    months?: number | Month[];
    rows: RowData[];
    onRowsChange: (rows: RowData[]) => void;
    sections?: Array<{
        type: RowType;
        placeholder: string;
    }>;
    colorScheme?: ColorScheme;
    /** @deprecated Use colorScheme instead */
    headerBg?: string;
    /** @deprecated Use colorScheme instead */
    headerText?: string;
    forceExpanded?: boolean;
    formatValue?: (value: number | null | undefined) => string;
    calculateTotal?: (monthId: string, rows: RowData[]) => number;
    showVariableColumn?: boolean;
    showClassificationColumns?: boolean;
    sourceFileIds?: string[];
    onViewSource?: (fileIds: string[]) => void;
    reliquidacion?: Record<string, ReliquidacionBreakdown>;
    getCellOriginClass?: (rowId: string, monthId: string) => string | undefined;
}
/** Reliquidación breakdown for a single month (passed from host app) */
interface ReliquidacionBreakdown {
    rentaFija: number;
    rentaVariable: number;
    imponibleFijo: number;
    imponibleVariable: number;
    noImponibleFijo: number;
    noImponibleVariable: number;
    cotizPreviFija: number;
    cotizSaludFija: number;
    cotizCesantiaFija: number;
    impuestoFijo: number;
    descuentosOtrosFijos: number;
    liquidoTotal: number;
}

declare const RentaTable: ({ title, months, rows, onRowsChange, sections, colorScheme: colorSchemeProp, headerBg: headerBgProp, headerText: headerTextProp, forceExpanded, formatValue, calculateTotal, showVariableColumn, showClassificationColumns, sourceFileIds, onViewSource, reliquidacion, getCellOriginClass, }: RentaTableProps) => react_jsx_runtime.JSX.Element;

declare const generateLastNMonths: (count: number) => Month[];

type BoletaMonth = {
    periodo: string;
    mes: string;
    hasData: boolean;
    boletas: number | null;
    bruto: number | null;
    retencion: number | null;
    liquido: number | null;
};
interface BoletasTableProps {
    title: string;
    months: BoletaMonth[];
    totales?: {
        boletas_vigentes?: number;
        honorario_bruto?: number;
        retencion_terceros?: number;
        retencion_contribuyente?: number;
        total_liquido?: number;
    };
    colorScheme?: ColorScheme;
    /** @deprecated Use colorScheme instead */
    headerBg?: string;
    /** @deprecated Use colorScheme instead */
    headerText?: string;
    sourceFileIds?: string[];
    onViewSource?: (fileIds: string[]) => void;
    onRemoveMonth?: (periodo: string) => void;
    /** Periodos excluded from summary calculations — columns are dimmed and clickable to toggle */
    excludedMonths?: string[];
    onToggleMonth?: (periodo: string) => void;
    /** Toggle all months at once (year-level select/deselect) */
    onToggleAll?: () => void;
    getCellOriginClass?: (metricKey: string, periodo: string) => string | undefined;
}
declare const BoletasTable: ({ title, months, colorScheme: colorSchemeProp, headerBg: headerBgProp, headerText: headerTextProp, sourceFileIds, onViewSource, excludedMonths, onToggleMonth, onToggleAll, getCellOriginClass, }: BoletasTableProps) => react_jsx_runtime.JSX.Element;

interface FinalResultsValues {
    renta_liquida_ajustada_comprador?: number | null;
    renta_liquida_ajustada_codeudor?: number | null;
    /** Array of adjusted incomes for multiple codeudores (codeudor1, codeudor2, etc.) */
    rentas_codeudores?: (number | null)[];
    total_rentas?: number | null;
    dividendo_hipotecario?: number | null;
    indice_carga_hipotecaria?: number | null;
    indice_carga_financiera_conjunta?: number | null;
    evaluacion_realizada_por?: string;
}
interface CodeudorIncomeInfo {
    name: string;
    calculatedIncome: number;
}
interface PromptOptions {
    message: string;
    title?: string;
    defaultValue?: string;
    type?: 'text' | 'number';
    icon?: string;
}
interface FinalResultsCompactProps {
    values: FinalResultsValues;
    onChange: (key: string, value: number | string | null | (number | null)[]) => void;
    calculatedDebtorIncome?: number;
    /** @deprecated Use codeudorIncomes array instead */
    calculatedCodebtorIncome?: number;
    /** Array of codeudor income info (name + calculated income) */
    codeudorIncomes?: CodeudorIncomeInfo[];
    calculatedDebts?: number;
    /** Prompt function for editing index values. If not provided, indices are display-only. */
    prompt?: (options: PromptOptions) => Promise<string | null>;
}
declare const FinalResultsCompact: ({ values, onChange, calculatedDebtorIncome, calculatedCodebtorIncome, codeudorIncomes, calculatedDebts, prompt, }: FinalResultsCompactProps) => react_jsx_runtime.JSX.Element;

type SoftDeletable = {
    deletedAt?: string;
    deletionReason?: string;
};

type AutoConvertRule = {
    source: string;
    target: string;
    formula: (value: number, params: Record<string, number>) => number;
    precision?: number;
};
type AutoComputeRule = {
    target: string;
    depends: string[];
    condition?: (row: Record<string, any>) => boolean;
    formula: (row: Record<string, any>, params: Record<string, number>) => number | null;
};
type SideEffect = {
    trigger: string;
    apply: (row: Record<string, any>, newValue: unknown) => Record<string, any>;
};
/**
 * Generate a bidirectional UF↔CLP conversion rule pair.
 * Usage: ...buildUfPair('valor_uf', 'valor_pesos', ufValue)
 */
declare function buildUfPair(ufKey: string, pesosKey: string, ufValue: number, ufPrecision?: number, pesosPrecision?: number): AutoConvertRule[];
/**
 * Apply auto-conversions after a field edit.
 * Given the edited field and its new value, applies matching conversion rules
 * (e.g. UF→CLP or CLP→UF) and returns the updated row.
 */
declare function applyAutoConversions<T extends Record<string, any>>(row: T, editedField: string, editedValue: any, rules: AutoConvertRule[], params: Record<string, number>): T;
/**
 * Apply auto-compute rules after a field edit.
 * Checks which compute rules depend on the edited field, evaluates conditions,
 * and applies formulas to compute derived values.
 */
declare function applyAutoCompute<T extends Record<string, any>>(row: T, editedField: string, rules: AutoComputeRule[], params: Record<string, number>): T;

type AssetRow = {
    id: string;
} & SoftDeletable & Record<string, unknown>;
interface ColumnDef {
    key: string;
    label: string;
    type: 'text' | 'currency' | 'number' | 'percent';
    /** Column width hint (e.g. '30%') — applied on <th>, browser distributes proportionally */
    width?: string;
    align?: 'left' | 'right' | 'center';
    placeholder?: string;
    isLabel?: boolean;
    /** Key of the paired UF/CLP field shown when currency toggle switches */
    ufPair?: string;
    /** Label to show when toggled to the paired field (default: auto-swap UF↔$) */
    ufPairLabel?: string;
    /** Type of the paired field (default: 'currency') */
    ufPairType?: 'currency' | 'number';
    /** Return class to apply when cell value is auto-computed */
    autoComputedClass?: (row: Record<string, unknown>) => string;
    /** Two fields rendered as "X / Y" (e.g. cuotas fraction) */
    compound?: {
        key: string;
        separator?: string;
    };
    /** Per-row cell visibility — false renders "—" instead of cell */
    visible?: (row: Record<string, unknown>) => boolean;
    /** Per-cell hover tooltip */
    tooltip?: (row: Record<string, unknown>) => string | null;
    /** Per-row read-only condition — true renders display-only */
    readOnly?: (row: Record<string, unknown>) => boolean;
    /** Inline EditableField pill — renders pill in front of this column's display value.
     *  `key` is the row field for the pill value; the column's own value becomes `displayValue`. */
    field?: {
        key: string;
        min?: number;
        max?: number;
        symbol?: string;
        defaultValue?: number;
    };
    /** Row field key that holds the source file ID for this column's value — shows Eye icon on hover */
    sourceFileIdKey?: string;
}
interface AssetTableProps<T extends AssetRow = AssetRow> {
    columns: ColumnDef[];
    rows: T[];
    onRowsChange: (rows: T[]) => void;
    idPrefix: string;
    addPlaceholder?: string;
    formatCurrency?: (value: number | null | undefined) => string;
    colorScheme?: ColorScheme;
    /** @deprecated Use colorScheme instead */
    headerBg?: string;
    /** @deprecated Use colorScheme instead */
    headerText?: string;
    title?: React.ReactNode;
    /** UF value — enables UF/$ toggle when columns have ufPair */
    ufValue?: number | null;
    /** Auto-conversion rules (UF↔CLP) */
    conversionRules?: AutoConvertRule[];
    /** Auto-compute rules */
    computeRules?: AutoComputeRule[];
    /** Side effects applied after conversions/compute */
    sideEffects?: SideEffect[];
    /** Callback to view source document — shows Eye icon on row hover */
    onViewSource?: (fileIds: string[]) => void;
    getCellOriginClass?: (rowId: string, colKey: string) => string | undefined;
    /** Enable row selection (checkboxes + bulk delete) */
    selectable?: boolean;
    /** Enable drag-to-reorder rows */
    reorderable?: boolean;
}
/**
 * Bundles all config for a CrudTable instance.
 * Jogi defines one per table type; CrudTable spreads it as props.
 */
interface TablePreset<T extends AssetRow = AssetRow> {
    idPrefix: string;
    addPlaceholder?: string;
    columns: ColumnDef[];
    conversionRules?: AutoConvertRule[];
    computeRules?: AutoComputeRule[];
    sideEffects?: SideEffect[];
    selectable?: boolean;
    reorderable?: boolean;
}

declare function AssetTable<T extends AssetRow>({ columns, rows, onRowsChange, idPrefix, addPlaceholder, formatCurrency, colorScheme: colorSchemeProp, headerBg: headerBgProp, headerText: headerTextProp, title, ufValue, conversionRules, computeRules, sideEffects, onViewSource, getCellOriginClass, selectable, reorderable, }: AssetTableProps<T>): react_jsx_runtime.JSX.Element;

interface ActivosSummaryItem {
    label: string;
    value: number | null;
    count: number;
}
interface ActivosSummaryProps {
    items: ActivosSummaryItem[];
    totalLabel?: string;
    formatCurrency?: (value: number | null | undefined) => string;
    colorScheme?: {
        totalBg: string;
        totalBorder: string;
        totalText: string;
        totalValueText: string;
    };
}
declare const ActivosSummary: ({ items, totalLabel, formatCurrency, colorScheme, }: ActivosSummaryProps) => react_jsx_runtime.JSX.Element;

type SummaryRowType = 'subheader' | 'data' | 'total' | 'grandtotal';
type SummaryRowFormat = 'currency' | 'percent' | 'integer';
interface SummaryRow {
    label: string;
    values: (number | null)[];
    type: SummaryRowType;
    format?: SummaryRowFormat;
    fieldKey?: string;
}
interface SummaryTableProps {
    columnHeaders: string[];
    rows: SummaryRow[];
    colorScheme?: ColorScheme;
    /** Extra column rendered before data columns (e.g., castigo input) */
    extraColumn?: {
        header: string;
        render: (row: SummaryRow, index: number) => ReactNode;
    };
    /** Rendered after the label text (e.g., warning icon) */
    renderLabelSuffix?: (row: SummaryRow, index: number) => ReactNode;
    /** Cell origin color class callback — receives row and column indices */
    getCellOriginClass?: (rowIndex: number, colIndex: number) => string | undefined;
    /** Custom cell renderer — return ReactNode to replace default cell content, null for default */
    renderCell?: (row: SummaryRow, colIndex: number, formattedValue: string) => ReactNode | null;
}

declare const SummaryTable: ({ columnHeaders, rows, extraColumn, renderLabelSuffix, colorScheme, getCellOriginClass, renderCell }: SummaryTableProps) => react_jsx_runtime.JSX.Element;

interface DeclaracionColumn {
    key: string;
    label: string;
}
interface DeclaracionRow {
    key: string;
    label: string;
    /** Optional code shown in a leading 'Código' column */
    code?: string;
    /** Whether this row should be included in the sum total */
    summed?: boolean;
}
interface DeclaracionTableProps {
    columns: DeclaracionColumn[];
    rows: DeclaracionRow[];
    /** Row data: rows × columns matrix. data[rowKey][colKey] = value */
    data: Record<string, Record<string, number | null>>;
    /** Total row config. When provided, shows a sum row at the bottom using only `summed` rows. */
    totalLabel?: string;
    formatCurrency: (value: number) => string;
    colorScheme?: ColorScheme;
    sourceFileIds?: string[];
    onViewSource?: (fileIds: string[]) => void;
    getCellOriginClass?: (rowKey: string, colKey: string) => string | undefined;
}

declare const DeclaracionTable: ({ columns, rows, data, totalLabel, formatCurrency, colorScheme: colorSchemeProp, sourceFileIds, onViewSource, getCellOriginClass, }: DeclaracionTableProps) => react_jsx_runtime.JSX.Element;

interface BalanceRow {
    id: string;
    empresa: string;
    rut: string;
    periodo: string;
    from_date?: string | null;
    to_date?: string | null;
    total_activos: number | null;
    total_pasivos: number | null;
    patrimonio: number | null;
    total_ingresos: number | null;
    total_gastos: number | null;
    resultado: number | null;
    participacion?: number | null;
    sourceFileId?: string;
}
interface BalanceTableProps {
    rows: BalanceRow[];
    onRowsChange: (rows: BalanceRow[]) => void;
    colorScheme?: ColorScheme;
    onViewSource?: (fileIds: string[]) => void;
    getCellOriginClass?: (rowId: string, field: string) => string | undefined;
}

declare const BalanceTable: ({ rows, onRowsChange, colorScheme: colorSchemeProp, onViewSource, getCellOriginClass, }: BalanceTableProps) => react_jsx_runtime.JSX.Element;

type CellOrigin = 'ai' | 'user' | 'calculated';
declare const ORIGIN_CLASSES: Record<CellOrigin, string>;

interface GridFocusedCell {
    rowId: string;
    cellKey: string;
}
interface GridStop {
    rowId: string;
    cellKey: string;
    ref: React.RefObject<HTMLElement | null>;
}
/**
 * A request to start editing a specific cell. `n` is a monotonic counter so
 * consumers can distinguish "second Enter on the same cell" from the first.
 * Scoping by (rowId, cellKey) prevents the request from being consumed by a
 * cell that wasn't the user's target — see the `editTrigger` regression where
 * tabbing into a sibling cell whose `effectiveEditTrigger` snapped 0→N caused
 * unintended edits / data loss.
 */
interface GridEditRequest {
    rowId: string;
    cellKey: string;
    initialValue: string | null;
    n: number;
}
interface GridClearRequest {
    rowId: string;
    cellKey: string;
    n: number;
}
interface GridKeyboard {
    focusedCell: GridFocusedCell | null;
    /** Cell-scoped edit request — `null` until the user triggers an edit. */
    editRequest: GridEditRequest | null;
    /** Cell-scoped clear request — `null` until the user presses Delete/Backspace. */
    clearRequest: GridClearRequest | null;
    isFocused: (rowId: string, cellKey: string) => boolean;
    focus: (rowId: string, cellKey: string) => void;
    clearFocus: () => void;
    navigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
    register: (stop: GridStop) => () => void;
    handleContainerKeyDown: (e: React.KeyboardEvent) => void;
}

interface EditableCellProps {
    value: number | string | null | undefined;
    onChange: (value: number | string | null) => void;
    type?: 'text' | 'number' | 'currency' | 'percent';
    isDeduction?: boolean;
    hasData?: boolean;
    className?: string;
    align?: 'left' | 'center' | 'right';
    placeholder?: string;
    /** Callback to view source document - shows Eye icon on hover */
    onViewSource?: () => void;
    /** Render as div instead of td (for non-table contexts) */
    asDiv?: boolean;
    /**
     * @deprecated Pass `keyboard`/`rowId`/`cellKey` instead — the registry path
     * derives focus from the `useGridKeyboard` hook. Slated for removal in the
     * next major. Zero call sites in jogi/main as of 2026-05-25.
     */
    focused?: boolean;
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    onCellFocus?: () => void;
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    requestEdit?: number;
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    requestClear?: number;
    /** @deprecated See `focused`. Use registry-path keyboard binding. */
    editInitialValue?: string | null;
    /** Text color class based on cell origin (ai/user/calculated). Overrides default text-ink-primary. */
    originClass?: string;
    /** Registry-path keyboard binding. When `keyboard`, `rowId`, and `cellKey` are all
     *  supplied, this cell registers a tab stop and reads focus/edit/clear state from
     *  the keyboard. The legacy per-cell focus/onNavigate/requestEdit props are then
     *  ignored. Tab routes through `keyboard.navigate(...)`. */
    keyboard?: GridKeyboard;
    rowId?: string;
    cellKey?: string;
}
/**
 * EditableCell - An inline-editable table cell
 *
 * Click to select (focus ring), double-click/Enter/F2/type to edit.
 * IMPORTANT: This component uses a fixed-size container to prevent layout shifts
 * when toggling between display and edit modes. The input is absolutely positioned
 * within a fixed-height container so clicking to edit does NOT scramble/shift
 * the table layout.
 */
declare const EditableCell: ({ value, onChange, type, isDeduction, hasData, className, align, placeholder, onViewSource, asDiv, focused, onCellFocus, onNavigate, requestEdit, requestClear, editInitialValue, originClass, keyboard, rowId, cellKey, }: EditableCellProps) => react_jsx_runtime.JSX.Element;

interface EditableFieldProps {
    /** Current value of the editable field */
    value: number | null;
    /** Called with new value after edit */
    onChange: (v: number) => void;
    /** The main display value — rendered after the pill, read-only */
    displayValue?: ReactNode;
    /** Default value — pill is hidden when value === defaultValue */
    defaultValue?: number;
    /** Input type — defaults to 'number' */
    type?: 'percent' | 'number';
    /** Clamp range [min, max] */
    min?: number;
    max?: number;
    /** Symbol inside pill after value. Default "×". Pass null to hide. */
    symbol?: string | null;
    /** Text color class based on cell origin */
    originClass?: string;
    /** Fixed width for the wrapper (e.g. "120px", "8rem") */
    width?: string;
    /** Extra Tailwind classes */
    className?: string;
    /** Registry-path keyboard binding. When `keyboard`, `rowId`, and `cellKey` are
     *  all supplied, the outer wrapper registers a tab stop and Tab routes through
     *  `keyboard.navigate(...)`. Without it, Tab is handled natively. */
    keyboard?: GridKeyboard;
    rowId?: string;
    cellKey?: string;
}
declare function EditableField({ value, onChange, displayValue, defaultValue, type, min, max, symbol, originClass, width, className, keyboard, rowId, cellKey, }: EditableFieldProps): react_jsx_runtime.JSX.Element;

interface DeleteDialogProps {
    count: number;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}
declare const DeleteDialog: ({ count, onConfirm, onCancel }: DeleteDialogProps) => react_jsx_runtime.JSX.Element;

type RecycleBinRow = {
    id: string;
} & SoftDeletable;
interface RecycleBinProps<T extends RecycleBinRow> {
    deletedRows: T[];
    getLabel: (row: T) => string;
    onRestore: (id: string) => void;
    renderCells?: (row: T) => React.ReactNode;
}
declare function RecycleBin<T extends RecycleBinRow>({ deletedRows, getLabel, onRestore, renderCells }: RecycleBinProps<T>): react_jsx_runtime.JSX.Element | null;

type SoftDeletableRow = {
    id: string;
} & SoftDeletable;
declare function useSoftDelete<T extends SoftDeletableRow>(rows: T[], onRowsChange: (rows: T[]) => void): {
    activeRows: T[];
    deletedRows: T[];
    deleteTargetId: string | null;
    requestDelete: (id: string) => void;
    confirmDelete: (reason: string) => void;
    cancelDelete: () => void;
    restoreRow: (id: string) => void;
};

declare const SourceIcon: ({ fileIds, onViewSource, className, }: {
    fileIds?: string[];
    onViewSource?: (ids: string[]) => void;
    className?: string;
}) => react_jsx_runtime.JSX.Element | null;
interface TableShellProps {
    colorScheme?: ColorScheme;
    /** @deprecated Use colorScheme instead */
    headerBg?: string;
    /** Extra classes on the header <tr> (e.g. border-t, text color) */
    headerClassName?: string;
    /** Extra classes on the outer wrapper div */
    className?: string;
    /** Number of data rows — when 0, footer is hidden */
    rowCount?: number;
    renderHeader: () => React$1.ReactNode;
    children: React$1.ReactNode;
    renderFooter?: () => React$1.ReactNode;
    renderAfterContent?: () => React$1.ReactNode;
}
declare const TableShell: ({ colorScheme: colorSchemeProp, headerBg: headerBgProp, headerClassName, className, rowCount, renderHeader, children, renderFooter, renderAfterContent, }: TableShellProps) => react_jsx_runtime.JSX.Element;

declare const generateId: (prefix: string) => string;
declare const formatDeletedDate: (iso: string) => string;
declare const MONTH_LABELS: Record<string, string>;
declare const displayCurrency: (value: number | undefined | null) => string;
/**
 * Compact currency: rounds to nearest thousand and displays without decimals.
 * 1_393_231 → "$1.393", 539_000 → "$539", 150 → "$0"
 */
/**
 * Full currency with em-dash for null/undefined.
 * 1_500_000 → "$ 1.500.000", null → "—"
 */
declare const defaultFormatCurrency: (value: number | null | undefined) => string;
declare const displayCurrencyCompact: (value: number | undefined | null, isDeduction?: boolean) => string;

/** Pill-styled clickable wrapper for header content. When `onClick` is provided,
 *  renders as an interactive pill with border + cursor. Otherwise renders children plain. */
declare const ClickableHeader: ({ onClick, borderColor, className, children }: {
    onClick?: () => void;
    borderColor?: string;
    className?: string;
    children: React$1.ReactNode;
}) => react_jsx_runtime.JSX.Element;

interface CollapsibleSectionProps {
    label: string;
    collapsed: boolean;
    onToggle: () => void;
    /** Inline summary shown next to label (e.g. total, count badge) */
    summary?: React$1.ReactNode;
    /** Extra classes on the header bar */
    headerClassName?: string;
    children: React$1.ReactNode;
}
declare const CollapsibleSection: ({ label, collapsed, onToggle, summary, headerClassName, children, }: CollapsibleSectionProps) => react_jsx_runtime.JSX.Element;

/**
 * Local collapse state for a set of named sections.
 * All sections start expanded (collapsed = false) unless initialCollapsed is provided.
 */
declare function useCollapsedState(keys: string[], initialCollapsed?: Record<string, boolean>): {
    collapsed: Record<string, boolean>;
    toggle: (key: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
};

export { ActivosSummary, type ActivosSummaryItem, type ActivosSummaryProps, type AssetRow, AssetTable, type AssetTableProps, type AutoComputeRule, type AutoConvertRule, type BalanceRow, BalanceTable, type BalanceTableProps, type BoletaMonth, BoletasTable, type BoletasTableProps, type CellOrigin, ClickableHeader, type CodeudorIncomeInfo, CollapsibleSection, type CollapsibleSectionProps, type ColorScheme, type ColumnDef, AssetTable as CrudTable, DEFAULT_SCHEME, type DeclaracionColumn, type DeclaracionRow, DeclaracionTable, type DeclaracionTableProps, DeleteDialog, EditableCell, EditableField, FinalResultsCompact, type FinalResultsCompactProps, type FinalResultsValues, MONTH_LABELS, type Month, ORIGIN_CLASSES, type PromptOptions, RecycleBin, type ReliquidacionBreakdown, type RentaTableProps, type RowData, type RowType, type SideEffect, type SoftDeletable, SourceIcon, type SummaryRow, type SummaryRowFormat, type SummaryRowType, SummaryTable, type SummaryTableProps, type TablePreset, TableShell, type TableShellProps, applyAutoCompute, applyAutoConversions, buildUfPair, RentaTable as default, defaultFormatCurrency, displayCurrency, displayCurrencyCompact, formatDeletedDate, generateId, generateLastNMonths, resolveColors, useCollapsedState, useSoftDelete };
