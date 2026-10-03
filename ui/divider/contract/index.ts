import type {DividerVariant} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Протокол разделителя областей интерфейса. */
export declare namespace UiDivider {
  /**
  Входные данные Divider.
  */
  interface Input {
    readonly variant?: DividerVariant | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Готовое представление в Document приложения. */
  type Output = JSX.Element
}
