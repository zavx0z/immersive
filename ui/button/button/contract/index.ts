import type {ButtonIconPosition} from "./types.ts"
import type {ButtonKeyboardEvent} from "./types.ts"
import type {ButtonPointerEvent} from "./types.ts"
import type {ButtonSize} from "./types.ts"
import type {ButtonTone} from "./types.ts"
import type {ButtonVariant} from "./types.ts"

import type {UiButtons} from "@ui/buttons/contract"

/** Протокол текстовой кнопки: внешний вид, доступность и исходные события действия. */
export declare namespace UiButtonsButton {
  /**
  Входные данные Button.
  */
  interface Input extends UiButtons.Input {
    readonly label: string
    readonly variant?: ButtonVariant | undefined
    readonly tone?: ButtonTone | undefined
    readonly size?: ButtonSize | undefined
    readonly selected?: boolean | undefined
    readonly role?: string | undefined
    readonly tabIndex?: number | undefined
    readonly "aria-expanded"?: boolean | string | undefined
    readonly "aria-haspopup"?: string | undefined
    readonly "aria-label"?: string | undefined
    readonly "aria-selected"?: boolean | string | undefined
    readonly "aria-controls"?: string | undefined
    readonly iconSrc?: string | undefined
    readonly startIcon?: string | undefined
    readonly endIcon?: string | undefined
    readonly iconPosition?: ButtonIconPosition | undefined
    readonly iconOnly?: boolean | undefined
    readonly iconSize?: number | undefined
    readonly onClick?: ((event: ButtonPointerEvent) => void) | undefined
    readonly onKeyDown?: ((event: ButtonKeyboardEvent) => void) | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = UiButtons.Output
}
