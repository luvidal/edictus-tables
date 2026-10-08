import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import RentaTable, { BoletasTable, CrudTable, DeclaracionTable } from '../src'
import type { RowData, Month, BoletaMonth, ColumnDef, AssetRow, DeclaracionColumn, DeclaracionRow } from '../src'
import './tailwind.css'

const MONTHS_12: Month[] = [
    { id: '2025-01', label: 'ENE' },
    { id: '2025-02', label: 'FEB' },
    { id: '2025-03', label: 'MAR' },
    { id: '2025-04', label: 'ABR' },
    { id: '2025-05', label: 'MAY' },
    { id: '2025-06', label: 'JUN' },
    { id: '2025-07', label: 'JUL' },
    { id: '2025-08', label: 'AGO' },
    { id: '2025-09', label: 'SEP' },
    { id: '2025-10', label: 'OCT' },
    { id: '2025-11', label: 'NOV' },
    { id: '2025-12', label: 'DIC' },
]

const MONTHS_3: Month[] = [
    { id: '2026-01', label: 'ENE' },
    { id: '2026-02', label: 'FEB' },
    { id: '2026-03', label: 'MAR' },
]

const valueSeries = (months: Month[], base: number) =>
    Object.fromEntries(months.map((m, i) => [m.id, base + i * 25_000]))

const RENTA_ROWS_12: RowData[] = [
    { id: 'r1', label: 'Sueldo Base', type: 'income', values: valueSeries(MONTHS_12, 1_500_000) },
    { id: 'r2', label: 'Gratificacion Legal', type: 'income', values: valueSeries(MONTHS_12, 250_000) },
    { id: 'r3', label: 'Bono Produccion', type: 'income', isVariable: true, values: valueSeries(MONTHS_12, 120_000) },
    { id: 'r4', label: 'Horas Extra', type: 'income', isVariable: true, values: valueSeries(MONTHS_12, 85_000) },
    { id: 'r5', label: 'AFP Cotizacion Obligatoria', type: 'deduction', values: valueSeries(MONTHS_12, 185_000) },
    { id: 'r6', label: 'Salud', type: 'deduction', values: valueSeries(MONTHS_12, 105_000) },
    { id: 'r7', label: 'Impuesto Unico', type: 'deduction', values: valueSeries(MONTHS_12, 45_000) },
]

const RENTA_ROWS_3: RowData[] = RENTA_ROWS_12.slice(0, 5).map(row => ({
    ...row,
    values: valueSeries(MONTHS_3, row.type === 'income' ? 800_000 : 100_000),
}))

const BOLETA_MONTHS: BoletaMonth[] = MONTHS_12.map((m, i) => ({
    periodo: m.id,
    mes: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][i],
    hasData: true,
    boletas: 3 + i,
    bruto: 1_000_000 + i * 100_000,
    retencion: 100_000 + i * 10_000,
    liquido: 900_000 + i * 90_000,
}))

type DebtRow = AssetRow & {
    entidad: string
    tipo: string
    deuda_total: number | null
    vigente: number | null
    atraso: number | null
}

const DEBT_COLUMNS: ColumnDef[] = [
    { key: 'entidad', label: 'Entidad', type: 'text', width: '34%', isLabel: true },
    { key: 'tipo', label: 'Tipo', type: 'text', width: '22%' },
    { key: 'deuda_total', label: 'Deuda total', type: 'currency', width: '22%' },
    { key: 'vigente', label: 'Vigente', type: 'currency', width: '22%' },
    { key: 'atraso', label: 'Atraso', type: 'currency', width: '18%' },
]

const DEBT_ROWS: DebtRow[] = [
    { id: 'd1', entidad: 'Banco Estado', tipo: 'Hipotecario', deuda_total: 85_000_000, vigente: 83_500_000, atraso: 1_200_000 },
    { id: 'd2', entidad: 'Banco Chile', tipo: 'Consumo', deuda_total: 4_500_000, vigente: 4_200_000, atraso: null },
    { id: 'd3', entidad: 'Banco Santander', tipo: 'Automotriz', deuda_total: 12_000_000, vigente: 11_800_000, atraso: null },
    { id: 'd4', entidad: 'Banco BCI', tipo: 'Comercial', deuda_total: 15_000_000, vigente: 14_500_000, atraso: 500_000 },
]

const DECLARACION_COLUMNS: DeclaracionColumn[] = [
    { key: '2024', label: '2024' },
    { key: '2023', label: '2023' },
]

const DECLARACION_ROWS: DeclaracionRow[] = [
    { key: 'ingresos', label: 'Ingresos', code: '628', summed: true },
    { key: 'egresos', label: 'Egresos', code: '629', summed: true },
    { key: 'resultado', label: 'Resultado', code: '643' },
]

const DECLARACION_DATA = {
    ingresos: { '2024': 450_000_000, '2023': 380_000_000 },
    egresos: { '2024': 120_000_000, '2023': 95_000_000 },
    resultado: { '2024': 330_000_000, '2023': 285_000_000 },
}

function Scenario({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink-secondary uppercase mb-1">{title}</h2>
            <p className="text-xs text-ink-tertiary mb-3">{description}</p>
            {children}
        </section>
    )
}

function RentaScenario({ compact = false }: { compact?: boolean }) {
    const [rows, setRows] = useState<RowData[]>(compact ? RENTA_ROWS_3 : RENTA_ROWS_12)
    return (
        <RentaTable
            title={compact ? 'Renta 3 meses' : 'Renta Liquida Titular'}
            months={compact ? MONTHS_3 : MONTHS_12}
            rows={rows}
            onRowsChange={setRows}
            sections={[
                { type: 'income', placeholder: 'Agregar ingreso...' },
                { type: 'deduction', placeholder: 'Agregar descuento...' },
            ]}
            showVariableColumn={!compact}
        />
    )
}

function CrudScenario() {
    const [rows, setRows] = useState<DebtRow[]>(DEBT_ROWS)
    return (
        <CrudTable<DebtRow>
            title="Deudas Financieras"
            columns={DEBT_COLUMNS}
            rows={rows}
            onRowsChange={setRows}
            idPrefix="debt"
            addPlaceholder="Agregar deuda..."
            selectable
            reorderable
        />
    )
}

function App() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8 text-ink-primary">
            <h1 className="text-xl font-bold mb-2">@edictus/tables preview</h1>
            <p className="text-sm text-ink-tertiary mb-8">
                Current package surfaces rendered with local fixtures.
            </p>

            <Scenario title="1. RentaTable - 12 months" description="Editable monthly spreadsheet with grouping, variable rows, and section subtotals.">
                <RentaScenario />
            </Scenario>

            <Scenario title="2. RentaTable - compact" description="Same engine with a shorter month range.">
                <RentaScenario compact />
            </Scenario>

            <Scenario title="3. CrudTable" description="Declarative column-driven table used by asset and debt-style reports.">
                <CrudScenario />
            </Scenario>

            <Scenario title="4. BoletasTable" description="Read-only monthly boletas metrics.">
                <BoletasTable title="Boletas de Honorarios 2025" months={BOLETA_MONTHS} />
            </Scenario>

            <Scenario title="5. DeclaracionTable" description="Read-only tax declaration matrix with code and year columns.">
                <DeclaracionTable
                    columns={DECLARACION_COLUMNS}
                    rows={DECLARACION_ROWS}
                    data={DECLARACION_DATA}
                    formatCurrency={(value) => `$ ${value.toLocaleString('es-CL')}`}
                />
            </Scenario>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(<App />)
