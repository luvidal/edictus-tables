import { describe, expect, it } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import BalanceTable from '../src/balance'
import type { BalanceRow } from '../src/balance/types'

const rows: BalanceRow[] = [{
    id: 'bal_0',
    empresa: 'Empresa Test',
    rut: '76123456-7',
    periodo: '2024',
    total_activos: 100_000_000,
    total_pasivos: 20_000_000,
    patrimonio: 80_000_000,
    total_ingresos: 10_000_000,
    total_gastos: 4_000_000,
    resultado: 6_000_000,
    participacion: 50,
}]

describe('BalanceTable', () => {
    it('labels company totals and ownership participation explicitly', () => {
        render(<BalanceTable rows={rows} onRowsChange={() => {}} />)

        expect(screen.getByText('Empresa 100%')).toBeTruthy()
        expect(screen.getByText('Participación')).toBeTruthy()
        expect(screen.getByText('50')).toBeTruthy()
    })
})
