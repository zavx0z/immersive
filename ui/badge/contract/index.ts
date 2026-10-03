import type {BadgeTone} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Протокол подписи состояния и её цветового тона. */
export declare namespace UiBadge {
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
  type Output = JSX.Element
}
