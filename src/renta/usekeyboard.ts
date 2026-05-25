import { useGridKeyboard } from '../common/usegridkeyboard'
export type { GridFocusedCell as FocusedCell } from '../common/usegridkeyboard'

interface UseKeyboardProps {
    visibleRowIds: string[]
}

/**
 * Thin wrapper around `useGridKeyboard` kept for the renta call site.
 * Pre-registry, this hook also tracked `monthCount` and exposed a
 * `monthIndex` alias on `focusedCell`. With the registry refactor neither
 * is needed: column count derives from each row's registered stops and
 * cells are addressed by month id (cellKey), not by index.
 */
export const useKeyboard = ({ visibleRowIds }: UseKeyboardProps) =>
    useGridKeyboard({ visibleRowIds })
