import type {ButtonPointerEvent} from "@ui-buttons/button"
import type {ButtonSize} from "@ui-buttons/button"
import type {ButtonTone} from "@ui-buttons/button"
import type {ButtonVariant} from "@ui-buttons/button"

/**
Входные данные IconButton.
*/
export interface IconButtonProps {
  readonly label: string
  readonly iconSrc: string
  readonly variant?: ButtonVariant | undefined
  readonly tone?: ButtonTone | undefined
  readonly size?: ButtonSize | undefined
  readonly disabled?: boolean | undefined
  readonly selected?: boolean | undefined
  readonly title?: string | undefined
  readonly iconSize?: number | undefined
  readonly style?: CssStyle | undefined
  readonly onClick?: ((event: ButtonPointerEvent) => void) | undefined
}
