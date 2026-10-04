import type {ListItem} from "../contract/types"
import type {ImmersiveUiComponentViewList} from "../contract"
type ListProps = ImmersiveUiComponentViewList.Input

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
