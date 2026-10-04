import type {ListItem} from "../contract/types"
import type {Zavx0zImmersiveUiComponentViewList} from "../contract"
type ListProps = Zavx0zImmersiveUiComponentViewList.Input

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
