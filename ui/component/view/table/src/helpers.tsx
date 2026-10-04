import type {DataCellProps} from "./types"
import type {HeaderCellProps} from "./types"
import type {TableCellContext} from "../contract/types.ts"
import type {Zavx0zImmersiveUiComponentViewTable} from "../contract/index"
type TableProps = Zavx0zImmersiveUiComponentViewTable.Input
import type {TableRowViewProps} from "./types"
import normalizeTableSelection from "@zavx0z/immersive-ui-view-table-normalize-table-selection"
import tableSelectionAfterClick from "@zavx0z/immersive-ui-component-view-table-selection-after-click"

/** Частная подготовка таблица строк и столбцов с управляемым выбором. */
export function HeaderCell(props: HeaderCellProps) {
  const width = props.column.width === undefined ? "auto" : `${props.column.width}px`
  const grow = props.column.width === undefined ? 1 : 0
  return <th
    data-column-key={props.column.key}
    data-last={props.last ? "true" : undefined}
    style={css`

  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 28px;
  flex-grow: 1;
  padding: 3px 7px;
  border-right: var(--border-width-control) solid var(--widget-regular-outline);
  background: transparent;
  color: var(--widget-list-content);
  font-size: var(--font-size-xs);

  &[data-last="true"] {
    border-right: 0;
  }


      ${css`
        color: var(--widget-regular-content);
        width: ${width};
        flex-grow: ${grow};
        flex-shrink: ${grow};
      `}
    `}
  >
    {props.column.label}
  </th>
}

/** Частная подготовка таблица строк и столбцов с управляемым выбором. */
export function DataCell(props: DataCellProps) {
  const width = props.column.width === undefined ? "auto" : `${props.column.width}px`
  const grow = props.column.width === undefined ? 1 : 0
  const context: TableCellContext = Object.freeze({
    row: props.row,
    rowIndex: props.rowIndex,
    column: props.column,
    columnIndex: props.columnIndex,
    value: props.value,
    selected: props.selected,
    disabled: props.disabled
  })
  const interactive = !props.disabled && props.isInteractive?.(context) === true && props.onActivate !== undefined
  const onClick = (event: PointerEvent) => {
    if (!interactive) return
    event.stopPropagation()
    props.onActivate?.(context, event)
  }
  return <td
    data-column-key={props.column.key}
    data-last={props.last ? "true" : undefined}
    data-interactive={interactive ? "true" : undefined}
    aria-disabled={String(props.disabled)}
    onClick={onClick}
    style={css`

  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 28px;
  flex-grow: 1;
  padding: 3px 7px;
  border-right: var(--border-width-control) solid var(--widget-regular-outline);
  background: transparent;
  color: var(--widget-list-content);
  font-size: var(--font-size-xs);

  &[data-last="true"] {
    border-right: 0;
  }


      ${css`
        width: ${width};
        flex-grow: ${grow};
        flex-shrink: ${grow};
      `}
    `}
  >
    {formatTableCellValue(props.value)}
  </td>
}

/** Частная подготовка таблица строк и столбцов с управляемым выбором. */
export function TableRowView(props: TableRowViewProps) {
  const onClick = (event: PointerEvent) => {
    if (props.disabled) return
    props.onSelectionChange?.(tableSelectionAfterClick(
      props.rowKeys,
      props.selectedKeys,
      props.row.key,
      props.anchorKey,
      event
    ), event)
    props.onActivate?.(props.row.key, event)
  }
  return <tr
    data-row-key={props.row.key}
    aria-selected={String(props.selected)}
    aria-disabled={String(props.disabled)}
    data-last={props.last ? "true" : undefined}
    onClick={onClick}
    style={css`

  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 28px;
  border-bottom: var(--border-width-control) solid var(--widget-regular-outline);
  background: var(--widget-number-background-readonly);

  &:hover {
    background: var(--widget-regular-background);
  }


      &[data-last="true"] {
        border-bottom: 0;
      }

      &[aria-selected="true"] {
        background: var(--widget-list-background-selected);
        color: var(--widget-list-content-selected);
      }

      &[aria-disabled="true"] {
        opacity: 0.5;
      }
    `}
  >
    {props.columns.map((column, index) => <DataCell
      key={column.key}
      row={props.row}
      rowIndex={props.rowIndex}
      column={column}
      columnIndex={index}
      value={props.row.cells[column.key] ?? ""}
      selected={props.selected}
      disabled={props.disabled}
      last={index === props.columns.length - 1}
      isInteractive={props.isCellInteractive}
      onActivate={props.onCellActivate}
    />)}
  </tr>
}

/** Частная подготовка таблица строк и столбцов с управляемым выбором. */
export function assertTableProps(props: TableProps): Readonly<{
  rowKeys: readonly string[]
  selectedKeys: readonly string[]
}> {
  if (!Array.isArray(props.columns) || props.columns.length === 0) {
    throw new TypeError("Table columns must be a non-empty array")
  }
  if (!Array.isArray(props.rows)) throw new TypeError("Table rows must be an array")
  const columnKeys = new Set<string>()
  for (const column of props.columns) {
    if (typeof column.key !== "string" || column.key.length === 0) throw new TypeError("Table column key must not be empty")
    if (columnKeys.has(column.key)) throw new Error(`Table column key must be unique: ${column.key}`)
    columnKeys.add(column.key)
    if (typeof column.label !== "string") throw new TypeError("Table column label must be a string")
    if (column.width !== undefined && (!Number.isFinite(column.width) || column.width <= 0)) {
      throw new RangeError(`Table column width must be positive: ${column.key}`)
    }
  }
  const rowKeys = new Set<string>()
  for (const row of props.rows) {
    if (typeof row.key !== "string" || row.key.length === 0) throw new TypeError("Table row key must not be empty")
    if (rowKeys.has(row.key)) throw new Error(`Table row key must be unique: ${row.key}`)
    rowKeys.add(row.key)
  }
  const selectedKey = props.selectedKey ?? null
  if (selectedKey !== null && !rowKeys.has(selectedKey)) throw new Error(`Table selected key does not exist: ${selectedKey}`)
  const keys = [...rowKeys]
  const requested = props.selectedKeys ?? (selectedKey === null ? [] : [selectedKey])
  return Object.freeze({
    rowKeys: Object.freeze(keys),
    selectedKeys: Object.freeze(normalizeTableSelection(keys, requested))
  })
}

/** Частная подготовка таблица строк и столбцов с управляемым выбором. */
export function formatTableCellValue(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value)
  return JSON.stringify(value)
}
