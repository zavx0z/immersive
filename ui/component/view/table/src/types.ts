import type {TableColumn, TableRow} from "../contract/types"
import type {UiViewsTable} from "../contract"
type TableProps = UiViewsTable.Input

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
