import type {Zavx0zImmersiveUiComponent} from "@zavx0z/immersive-ui-component/contract"
import type {DividerVariant} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Протокол разделителя областей интерфейса. */
export declare namespace Zavx0zImmersiveUiComponentDivider {
  /**
  Входные данные Divider.
  */
  interface Input {
    readonly variant?: DividerVariant | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Готовое представление в Document приложения. */
  type Output = Zavx0zImmersiveUiComponent.Output & JSX.Element
}
