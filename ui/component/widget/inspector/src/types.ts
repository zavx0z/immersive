import type {InspectorCategory} from "../contract/types"
import type {UiWidgetsInspector} from "../contract"
type InspectorProps = UiWidgetsInspector.Input

/**
Тип CategoryButtonProps принадлежит контракту своего владельца.
*/
export type CategoryButtonProps = Readonly<{
  category: InspectorCategory
  selected: boolean
  onChange?: InspectorProps["onCategoryChange"]
}>
