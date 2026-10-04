import type {InspectorCategory} from "../contract/types"
import type {Zavx0zImmersiveUiComponentWidgetInspector} from "../contract"
type InspectorProps = Zavx0zImmersiveUiComponentWidgetInspector.Input

/**
Тип CategoryButtonProps принадлежит контракту своего владельца.
*/
export type CategoryButtonProps = Readonly<{
  category: InspectorCategory
  selected: boolean
  onChange?: InspectorProps["onCategoryChange"]
}>
