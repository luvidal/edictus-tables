# @edictus/tables

[English](README.md) · **Español**

Componentes de tablas financieras en React y TypeScript, hechos para analistas
de crédito que trabajan con datos chilenos de sueldos, impuestos y activos.
Incluye:

- planillas mensuales de renta editables;
- tablas de boletas de honorarios y de declaraciones de impuestos;
- balances y resúmenes;
- una tabla CRUD genérica basada en columnas.

## Lo destacado

- **`RentaTable`**: una tabla mensual tipo planilla con:
  - filas agrupadas y colapsables;
  - edición en línea;
  - navegación con teclado (flechas, Tab, Enter, Escape);
  - reordenamiento con arrastrar y soltar;
  - filas para agregar ítems en cada sección.
- **`CrudTable`**: un solo motor basado en columnas (`ColumnDef`,
  `TablePreset`) detrás de todas las tablas de activos. Permite seleccionar,
  reordenar, combinar celdas y convertir campos automáticamente, por ejemplo UF
  ↔ pesos con `buildUfPair`.
- **Tablas del dominio:**
  - `BoletasTable` (boletas de honorarios)
  - `DeclaracionTable` (declaraciones de impuestos)
  - `BalanceTable`
  - `SummaryTable`
  - `ActivosSummary`
  - `FinalResultsCompact`
- **Eliminación reversible con papelera** (`useSoftDelete`, `RecycleBin`) y
  actualizaciones optimistas: la interfaz cambia primero y los callbacks se
  ejecutan después.
- **Temas por tokens** con variables CSS (`surface` / `ink` / `edge` /
  `status`). Se complementa con
  [`@edictus/theme`](https://github.com/luvidal/edictus-theme).
- **121 tests** con Vitest y happy-dom.

## Instalación

```bash
npm i github:luvidal/edictus-tables#<sha-del-commit>
```

Dependencias peer: `react` y `react-dom` ≥ 18, y `lucide-react`. Agrega
`./node_modules/@edictus/tables/dist/**/*.{js,mjs}` al `content` de Tailwind.

## Uso

```tsx
import { useState } from 'react'
import RentaTable, { type RowData } from '@edictus/tables'

export function IncomeTable() {
  const [rows, setRows] = useState<RowData[]>([
    { id: 'base', label: 'Sueldo base', type: 'income', values: {} },
    { id: 'afp', label: 'Cotización AFP', type: 'deduction', values: {} },
  ])
  return <RentaTable title="Renta líquida" months={3} rows={rows} onRowsChange={setRows} />
}
```

Las notas de cada componente están junto al código (en inglés):
- [RentaTable](src/renta/README.md)
- [CrudTable](src/assets/README.md)
- [BoletasTable](src/boletas/README.md)
- [piezas compartidas](src/common/README.md)

## Desarrollo

```bash
npm run preview   # página de prueba visual con datos de ejemplo (Vite) en http://localhost:5173
npm test          # Vitest + happy-dom
npm run build     # tsup → dist/ (ESM + CJS + declaraciones de tipos)
```
