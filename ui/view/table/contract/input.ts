import type {TableCellContext} from "./types.ts"
import type {TableColumn} from "./types.ts"
import type {TableRow} from "./types.ts"
import type {TableSelectionUpdate} from "./types.ts"

/**
Входные данные Table.
*/
export interface TableProps {
  readonly columns: readonly TableColumn[]
  readonly rows: readonly TableRow[]
  readonly selectedKey?: string | null | undefined
  readonly selectedKeys?: readonly string[] | undefined
  readonly selectionAnchorKey?: string | null | undefined
  readonly disabled?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onRowActivate?: ((key: string, event: Event) => void) | undefined
  readonly onSelectionChange?: ((update: TableSelectionUpdate, event: Event) => void) | undefined
  readonly isCellInteractive?: ((context: TableCellContext) => boolean) | undefined
  readonly onCellActivate?: ((context: TableCellContext, event: Event) => void) | undefined
}
