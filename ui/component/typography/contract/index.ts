import type {Zavx0zImmersiveUiComponent} from "@zavx0z/immersive-ui-component/contract"
import type {TypographyVariant} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Протокол текстового представления с выбранной типографикой. */
export declare namespace Zavx0zImmersiveUiComponentTypography {
  /**
  Входные данные Typography.
  */
  interface Input {
    readonly text: string
    readonly variant?: TypographyVariant | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Готовое представление в Document приложения. */
  type Output = Zavx0zImmersiveUiComponent.Output & JSX.Element
}
