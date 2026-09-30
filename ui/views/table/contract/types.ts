import type {TableProps} from "./input.ts"

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

/**
Тип TableSelectionGesture принадлежит контракту своего владельца.
*/
export type TableSelectionGesture = Readonly<{
  metaKey?: boolean | undefined
  ctrlKey?: boolean | undefined
  shiftKey?: boolean | undefined
}>

/**
Тип TableSelectionUpdate принадлежит контракту своего владельца.
*/
export type TableSelectionUpdate = Readonly<{
  selectedKeys: readonly string[]
  anchorKey: string
}>

/**
Тип HeaderCellProps принадлежит контракту своего владельца.
*/
export type HeaderCellProps = Readonly<{column: TableColumn; last: boolean}>

/**
Тип DataCellProps принадлежит контракту своего владельца.
*/
export type DataCellProps = Readonly<{
  row: TableRow
  rowIndex: number
  column: TableColumn
  columnIndex: number
  value: unknown
  selected: boolean
  disabled: boolean
  last: boolean
  isInteractive?: TableProps["isCellInteractive"]
  onActivate?: TableProps["onCellActivate"]
}>

/**
Тип TableRowViewProps принадлежит контракту своего владельца.
*/
export type TableRowViewProps = Readonly<{
  row: TableRow
  rowIndex: number
  columns: readonly TableColumn[]
  rowKeys: readonly string[]
  selectedKeys: readonly string[]
  anchorKey: string | null
  selected: boolean
  disabled: boolean
  last: boolean
  onActivate?: TableProps["onRowActivate"]
  onSelectionChange?: TableProps["onSelectionChange"]
  isCellInteractive?: TableProps["isCellInteractive"]
  onCellActivate?: TableProps["onCellActivate"]
}>
