import type {InspectorCategory} from "../contract/types"
import type {ImmersiveUiComponentWidgetInspector} from "../contract"
type InspectorProps = ImmersiveUiComponentWidgetInspector.Input

/**
Тип CategoryButtonProps принадлежит контракту своего владельца.
*/
export type CategoryButtonProps = Readonly<{
  category: InspectorCategory
  selected: boolean
  onChange?: InspectorProps["onCategoryChange"]
}>
