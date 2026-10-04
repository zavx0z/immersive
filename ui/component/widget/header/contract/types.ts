import type {ImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"
import type {ImmersiveUiComponentButtonBasic} from "@zavx0z/immersive-ui-component-button-basic"

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
  tone?: ImmersiveUiComponentButtonBasic.Input["tone"] | undefined
  badgeTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  dividerAfter?: boolean | undefined
  onAction?: ((event: Event) => void) | undefined
}>
