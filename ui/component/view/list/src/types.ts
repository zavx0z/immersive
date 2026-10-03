import type {ListItem} from "../contract/types"
import type {UiViewsList} from "../contract"
type ListProps = UiViewsList.Input

/**
Тип ListRowProps принадлежит контракту своего владельца.
*/
export type ListRowProps = Readonly<{
  item: ListItem
  selected: boolean
  disabled: boolean
  dense: boolean
  embedded: boolean
  onSelect?: ListProps["onSelect"]
}>
