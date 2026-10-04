import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveUiComponentButtonBasic} from "@immersive-ui-component-button/basic"

import type {ImmersiveUiComponentButton} from "@immersive-ui-component/button/contract"

/** Протокол кнопки со значком и обязательным доступным названием действия. */
export declare namespace ImmersiveUiComponentButtonIcon {
  /**
  Входные данные IconButton.
  */
  interface Input extends ImmersiveUiComponentButton.Input {
    readonly label: string
    readonly iconSrc: string
    readonly variant?: ImmersiveUiComponentButtonBasic.Input["variant"] | undefined
    readonly tone?: ImmersiveUiComponentButtonBasic.Input["tone"] | undefined
    readonly size?: ImmersiveUiComponentButtonBasic.Input["size"] | undefined
    readonly selected?: boolean | undefined
    readonly iconSize?: number | undefined
    readonly onClick?: ImmersiveUiComponentButtonBasic.Input["onClick"] | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = ImmersiveUiComponentButton.Output & JSX.Element
}
