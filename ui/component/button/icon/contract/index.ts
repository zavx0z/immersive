import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentButtonBasic} from "@zavx0z/immersive-ui-component-button-basic"

import type {Zavx0zImmersiveUiComponentButton} from "@zavx0z/immersive-ui-component-button/contract"

/** Протокол кнопки со значком и обязательным доступным названием действия. */
export declare namespace Zavx0zImmersiveUiComponentButtonIcon {
  /**
  Входные данные IconButton.
  */
  interface Input extends Zavx0zImmersiveUiComponentButton.Input {
    readonly label: string
    readonly iconSrc: string
    readonly variant?: Zavx0zImmersiveUiComponentButtonBasic.Input["variant"] | undefined
    readonly tone?: Zavx0zImmersiveUiComponentButtonBasic.Input["tone"] | undefined
    readonly size?: Zavx0zImmersiveUiComponentButtonBasic.Input["size"] | undefined
    readonly selected?: boolean | undefined
    readonly iconSize?: number | undefined
    readonly onClick?: Zavx0zImmersiveUiComponentButtonBasic.Input["onClick"] | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = Zavx0zImmersiveUiComponentButton.Output & JSX.Element
}
