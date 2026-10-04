import type {Zavx0zImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"
import type {Zavx0zImmersiveUiComponentButtonBasic} from "@zavx0z/immersive-ui-component-button-basic"

/**
Тип WidgetAction принадлежит контракту своего владельца.
*/
export type WidgetAction = Readonly<{
  id: string
  label: string
  iconSrc?: string | undefined
  badge?: string | undefined
  disabled?: boolean | undefined
  selected?: boolean | undefined
  tone?: Zavx0zImmersiveUiComponentButtonBasic.Input["tone"] | undefined
  badgeTone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
  dividerAfter?: boolean | undefined
  onAction?: ((event: Event) => void) | undefined
}>
