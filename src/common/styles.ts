// Shared Report Table Styles — single source of truth for all table padding,
// fonts, and structural classes. Every table component must use these tokens.
//
// Padding tiers:
//   cell/cellValue       — read-only rows (compact)
//   cellEdit/cellEditVal — editable rows (taller for click-to-edit targets)
//   headerCell           — column headers (th)
//   headerAccordion      — accordion header (TableShell title bar)
//   totalCell            — footer/total rows
//
// Color classes resolve against the unified token palette owned by the
// host (styles/tokens.css). surface-*, ink-*, edge-*, status-* are mapped
// in @jogi/tables/tailwind.config.ts and the host tailwind.config.ts.

export const T = {
    // ── Base ──
    table: 'w-full text-xs border-separate border-spacing-0',

    // ── Header: accordion bar (TableShell) ──
    headerAccordion: 'px-4 py-2.5',
    headerAccordionStat: 'px-2 py-2.5 text-right whitespace-nowrap',
    headerTitle: 'font-normal text-xs truncate',
    headerStat: 'font-normal text-xs',
    headerStatLabel: 'font-normal text-xs',
    headerCount: 'font-medium text-xs',

    // ── Header: column headers (th) ──
    th: 'text-ink-tertiary font-medium text-xs uppercase',
    headerCell: 'px-2 py-1.5 whitespace-nowrap',
    /** Vertical divider between columns */
    vline: 'border-r border-edge-subtle/10',
    /** Legacy action-column placeholder. The hover toolbar overlays the row's
     * left edge instead of occupying a dedicated column, so this width is now
     * 0 — the placeholder `<td>` cells stay only to preserve column counts
     * across header/body/footer in tables that still emit them (renta).
     */
    actionCol: 'w-0 p-0',
    /** Compact cell padding for small icon/badge columns (80px min) */
    cellCompact: 'px-0.5 py-1 whitespace-nowrap',

    // ── Body: read-only cells (compact) ──
    cell: 'py-1.5 px-3 whitespace-nowrap',
    cellValue: 'py-1.5 px-3 text-right tabular-nums whitespace-nowrap',
    cellLabel: 'overflow-hidden',

    // ── Body: editable cells (taller click targets) ──
    cellEdit: 'px-2 py-1.5 whitespace-nowrap',
    cellEditLabel: 'pl-1 pr-2 py-1.5 whitespace-nowrap',

    // ── Totals / footer ──
    totalCell: 'px-2 py-1.5 whitespace-nowrap',
    totalLabel: 'font-medium text-xs',
    totalValue: 'font-medium text-xs',
    footerLabel: 'font-bold',
    footerValue: 'font-bold',

    // ── Inputs (transparent inline) ──
    input: 'bg-transparent border-none outline-none text-xs truncate text-ink-primary placeholder-ink-tertiary/35',
    inputLabel: 'bg-transparent border-none outline-none text-xs font-medium truncate text-ink-primary placeholder-ink-tertiary/35',
    inputPlaceholder: 'bg-transparent border-none outline-none text-xs text-ink-secondary placeholder-ink-tertiary/35 truncate',
    rowLabel: 'bg-transparent border-none outline-none text-xs font-medium text-ink-primary truncate',

    // ── Typography helpers ──
    sectionTitle: 'font-normal text-xs',
    /** Data row indent (child rows below subheaders) */
    cellIndent: 'pl-6',
    muted: 'text-xs text-ink-secondary',
    empty: 'text-xs text-ink-tertiary/60 italic',
    cardLabel: 'text-xs font-medium',
    cardValue: 'text-xs font-semibold',

    // ── Row classes ──
    row: 'border-b border-edge-subtle/10',
    rowBorder: 'border-b border-edge-subtle/10',
    rowHover: 'hover:bg-surface-1/60',
    rowTotal: 'border-b bg-surface-1/80 border-edge-subtle/20',
    rowGrandtotal: 'border-b-2 bg-surface-2 border-edge-subtle/30',
} as const
