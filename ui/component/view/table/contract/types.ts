import type {ImmersiveUiComponentViewTableSelectionAfterClick} from "@immersive-ui-component-view-table/selection-after-click"

/**
Тип TableColumn принадлежит контракту своего владельца.
*/
export type TableColumn = Readonly<{
  key: string
  label: string
  width?: number | undefined
}>

/**
Тип TableRow принадлежит контракту своего владельца.
*/
export type TableRow = Readonly<{
  key: string
  cells: Readonly<Record<string, unknown>>
  disabled?: boolean | undefined
}>

/**
Тип TableCellContext принадлежит контракту своего владельца.
*/
export type TableCellContext = Readonly<{
  row: TableRow
  rowIndex: number
  column: TableColumn
  columnIndex: number
  value: unknown
  selected: boolean
  disabled: boolean
}>

/** Результат операции выбора строк передаётся владельцу таблицы без копирования полей. */
export type TableSelectionUpdate = ImmersiveUiComponentViewTableSelectionAfterClick.Output
