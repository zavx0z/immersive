import type {TreeItem} from "../contract/types"
import type {WindowedTreeBlock} from "./windowing"

/**
Тип TreeRow принадлежит контракту своего владельца.
*/
export type TreeRow = Readonly<{item: TreeItem; parent: string | null}>

/**
Тип TreeItemBlock принадлежит контракту своего владельца.
*/
export type TreeItemBlock = Extract<WindowedTreeBlock<TreeItem>, {kind: "item"}>

/**
Тип TreeContext принадлежит контракту своего владельца.
*/
export type TreeContext = Readonly<{
  expanded: ReadonlySet<string>
  selected: ReadonlySet<string>
  focusKey: string | null
  refs: Map<string, HTMLLIElement>
  select(id: string, event: MouseEvent): void
  toggle(id: string, event: Event): void
  activate(id: string, event: Event): void
  key(id: string, event: KeyboardEvent): void
  focusIn(id: string): void
  rowHeight: number
}>
