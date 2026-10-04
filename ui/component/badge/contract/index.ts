import type {Zavx0zImmersiveUiComponent} from "@zavx0z/immersive-ui-component/contract"
import type {BadgeTone} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Протокол подписи состояния и её цветового тона. */
export declare namespace Zavx0zImmersiveUiComponentBadge {
  /**
  Входные данные Badge.
  */
  interface Input {
    readonly label: string
    readonly tone?: BadgeTone | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Готовое представление в Document приложения. */
  type Output = Zavx0zImmersiveUiComponent.Output & JSX.Element
}
