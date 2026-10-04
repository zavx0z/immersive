import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {BadgeTone} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Протокол подписи состояния и её цветового тона. */
export declare namespace ImmersiveUiComponentBadge {
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
  type Output = ImmersiveUiComponent.Output & JSX.Element
}
