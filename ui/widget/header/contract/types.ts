import type {BadgeTone} from "@ui/badge"
import type {ButtonTone} from "@ui-buttons/button"

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
  tone?: ButtonTone | undefined
  badgeTone?: BadgeTone | undefined
  dividerAfter?: boolean | undefined
  onAction?: ((event: Event) => void) | undefined
}>
