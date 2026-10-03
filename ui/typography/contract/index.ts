import type {Zavx0zUi} from "@zavx0z/ui/contract"
import type {TypographyVariant} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Протокол текстового представления с выбранной типографикой. */
export declare namespace UiTypography {
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
  type Output = Zavx0zUi.Output & JSX.Element
}
