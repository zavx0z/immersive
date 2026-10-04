import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {TypographyVariant} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Протокол текстового представления с выбранной типографикой. */
export declare namespace ImmersiveUiComponentTypography {
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
  type Output = ImmersiveUiComponent.Output & JSX.Element
}
