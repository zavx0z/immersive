import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {DividerVariant} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Протокол разделителя областей интерфейса. */
export declare namespace ImmersiveUiComponentDivider {
  /**
  Входные данные Divider.
  */
  interface Input {
    readonly variant?: DividerVariant | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Готовое представление в Document приложения. */
  type Output = ImmersiveUiComponent.Output & JSX.Element
}
