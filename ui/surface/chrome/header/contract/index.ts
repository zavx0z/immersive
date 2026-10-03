

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiSurfacesChromeHeader {
  /**
  Входные данные SurfaceHeader.
  */
  interface Input {
    readonly style?: CssStyle | undefined
  }

  /** Содержимое предоставляется вызывающей стороной в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = JSX.Element<Slots>
}
