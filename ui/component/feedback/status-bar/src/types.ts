import type {StatusBarItem} from "../contract/types"

/**
Тип StatusBarItemViewProps принадлежит контракту своего владельца.
*/
export type StatusBarItemViewProps = Readonly<{
  item: StatusBarItem
  first: boolean
  separator: string
}>
