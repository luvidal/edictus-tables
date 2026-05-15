import React from 'react'
import EditableCell from '../common/editablecell'
import { T } from '../common/styles'
import { isSubtractType } from './helpers'
import type { Month, SectionDef } from './types'

interface AddRowProps {
    section: SectionDef
    months: Month[]
    labelValue: string
    onLabelChange: (value: string) => void
    onAddRow: (label: string) => void
    onAddRowWithValue: (monthId: string, value: number | null) => void
    showVariableColumn?: boolean
    showClassificationColumns?: boolean
}

const AddRow = ({
    section,
    months,
    labelValue,
    onLabelChange,
    onAddRow,
    onAddRowWithValue,
    showVariableColumn = false,
    showClassificationColumns = false,
}: AddRowProps) => {
    const subtract = isSubtractType(section.type)
    const bgClass = subtract
        ? 'bg-status-pending/5 border-status-pending/20'
        : 'bg-surface-1/40 border-edge-subtle/10'

    return (
        <tr className={`border-b border-dashed ${bgClass}`}>
            <td className={`${T.cellEdit} ${showClassificationColumns ? '' : T.vline}`}>
                <input
                    type="text"
                    placeholder={section.placeholder}
                    value={labelValue}
                    onChange={(e) => onLabelChange(e.target.value)}
                    className={`w-full ${T.inputPlaceholder}`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && labelValue.trim()) {
                            onAddRow(labelValue)
                        }
                    }}
                />
            </td>
            {showClassificationColumns && <><td className={T.cellCompact} /><td className={`${T.cellCompact} ${T.vline}`} /></>}
            {showVariableColumn && !showClassificationColumns && <td className={`${T.cellCompact} text-center ${T.vline}`}><span className={T.empty}>—</span></td>}
            {months.map((p, mi) => (
                <EditableCell
                    key={p.id}
                    value={null}
                    onChange={(v) => onAddRowWithValue(p.id, v as number | null)}
                    isDeduction={subtract}
                    hasData={false}
                    className={mi < months.length - 1 ? T.vline : ''}
                    type="currency"
                />
            ))}
            <td className={T.actionCol}></td>
        </tr>
    )
}

export default AddRow
