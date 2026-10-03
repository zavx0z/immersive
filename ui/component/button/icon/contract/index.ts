import type {JSX} from "@jsx-compiler/session"
import type {UiButtonsButton} from "@ui-buttons/button"

import type {UiButtons} from "@ui/buttons/contract"

/** Протокол кнопки со значком и обязательным доступным названием действия. */
export declare namespace UiButtonsIconButton {
  /**
  Входные данные IconButton.
  */
  interface Input extends UiButtons.Input {
    readonly label: string
    readonly iconSrc: string
    readonly variant?: UiButtonsButton.Input["variant"] | undefined
    readonly tone?: UiButtonsButton.Input["tone"] | undefined
    readonly size?: UiButtonsButton.Input["size"] | undefined
    readonly selected?: boolean | undefined
    readonly iconSize?: number | undefined
    readonly onClick?: UiButtonsButton.Input["onClick"] | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = UiButtons.Output & JSX.Element
}
