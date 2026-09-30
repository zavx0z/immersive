/**
Таблица строк и столбцов с управляемым выбором.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {HeaderCell} from "./src/helpers.tsx"
import type {TableProps} from "./contract/input.ts"
import {TableRowView} from "./src/helpers.tsx"
import {assertTableProps} from "./src/helpers.tsx"

export type {TableProps} from "./contract/input"
export type {TableColumn, TableRow, TableCellContext, TableSelectionGesture, TableSelectionUpdate} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Table(props: TableProps): JSX.Element {
  const selection = assertTableProps(props)
  return <table
    title={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      border: var(--border-width-control) solid var(--widget-regular-outline);
      border-radius: 4px;
      overflow: clip;
      background: var(--widget-text-background);

      ${props.style}
    `}
  >
    <thead style={css`
  display: flex;
  flex-direction: column;
  width: 100%;
`}>
      <tr
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


          ${css`
            background: var(--widget-regular-outline);
          `}
        `}
      >
        {props.columns.map((column, index) => <HeaderCell
          key={column.key}
          column={column}
          last={index === props.columns.length - 1}
        />)}
      </tr>
    </thead>
    <tbody style={css`
  display: flex;
  flex-direction: column;
  width: 100%;
`}>
      {props.rows.map((row, index) => <TableRowView
        key={row.key}
        row={row}
        rowIndex={index}
        columns={props.columns}
        rowKeys={selection.rowKeys}
        selectedKeys={selection.selectedKeys}
        anchorKey={props.selectionAnchorKey ?? selection.selectedKeys.at(-1) ?? null}
        selected={selection.selectedKeys.includes(row.key)}
        disabled={props.disabled === true || row.disabled === true}
        last={index === props.rows.length - 1}
        onActivate={props.onRowActivate}
        onSelectionChange={props.onSelectionChange}
        isCellInteractive={props.isCellInteractive}
        onCellActivate={props.onCellActivate}
      />)}
    </tbody>
  </table>
}
