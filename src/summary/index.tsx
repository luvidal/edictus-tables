import { T } from '../common/styles'
import { DEFAULT_SCHEME } from '../common/colors'
import { displayCurrencyCompact, displayCurrency } from '../common/utils'
import type { SummaryRowFormat, SummaryTableProps } from './types'

function formatCell(v: number | null, format: SummaryRowFormat): { display: string; title: string | undefined } {
  if (v == null) return { display: '—', title: undefined }

  switch (format) {
    case 'percent': {
      const pct = v * 100
      const display = pct.toFixed(2).replace('.', ',') + ' %'
      const full = pct.toFixed(4).replace('.', ',') + ' %'
      return { display, title: full !== display ? full : undefined }
    }
    case 'integer':
      return { display: String(Math.round(v)), title: undefined }
    default:
      return { display: displayCurrencyCompact(v), title: displayCurrency(v) || undefined }
  }
}

const SummaryTable = ({ columnHeaders, rows, extraColumn, renderLabelSuffix, colorScheme, getCellOriginClass, renderCell }: SummaryTableProps) => {
  const colors = colorScheme ?? DEFAULT_SCHEME

  return (
    <div className="overflow-x-auto border-y border-edge-subtle/20 mb-3 sm:mb-4">
      <table className={`${T.table} border-collapse`}>
        <tbody>
          {rows.map((row, idx) => {
            if (row.type === 'subheader') {
              return (
                <tr key={idx} className={`border-b-2 ${colors.bg} ${colors.border}`}>
                  <td className={`${T.cell} ${T.th} font-bold ${colors.text} tracking-wider ${T.vline}`}>{row.label}</td>
                  {extraColumn && (
                    <td className={`${T.cell} ${T.th} text-right font-bold ${colors.text} ${T.vline}`}>{extraColumn.header}</td>
                  )}
                  {columnHeaders.map((col, i) => (
                    <td key={i} className={`${T.cell} ${T.th} text-right font-bold ${colors.text} ${i < columnHeaders.length - 1 ? T.vline : ''}`}>{col}</td>
                  ))}
                </tr>
              )
            }

            const isTotal = row.type === 'total'
            const isFinal = row.type === 'grandtotal'
            const bold = isTotal || isFinal
            const fmt = row.format ?? 'currency'
            const rowClass = isFinal
              ? `border-b-2 ${colors.bg} ${colors.border}`
              : isTotal ? T.rowTotal : T.row

            return (
              <tr key={idx} className={rowClass}>
                <td className={`${T.cell} ${bold ? T.footerLabel + ' text-ink-primary' : T.muted + ' ' + T.cellIndent} ${T.vline}`}>
                  {row.label}
                  {renderLabelSuffix?.(row, idx)}
                </td>
                {extraColumn && (
                  <td className={T.vline}>
                    {extraColumn.render(row, idx)}
                  </td>
                )}
                {row.values.map((v, i) => {
                  const { display, title } = formatCell(v, fmt)
                  const custom = renderCell?.(row, i, display)
                  const originClass = getCellOriginClass?.(idx, i)
                  const textClass = bold
                    ? `${T.footerValue} ${originClass || 'text-ink-primary'}`
                    : (originClass || 'text-ink-secondary')
                  return (
                    <td
                      key={i}
                      title={custom ? undefined : title}
                      className={`${T.cellValue} ${custom ? '' : textClass}${!custom && title ? ' cursor-default' : ''} ${i < row.values.length - 1 ? T.vline : ''}`}
                    >
                      {custom ?? display}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SummaryTable
