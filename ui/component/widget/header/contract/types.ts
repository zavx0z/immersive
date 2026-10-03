import type {UiBadge} from "@ui/badge"
import type {UiButtonsButton} from "@ui-buttons/button"

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
  tone?: UiButtonsButton.Input["tone"] | undefined
  badgeTone?: UiBadge.Input["tone"] | undefined
  dividerAfter?: boolean | undefined
  onAction?: ((event: Event) => void) | undefined
}>
