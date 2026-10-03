

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiSurfacesChromeBody {
  /**
  Входные данные SurfaceBody.
  */
  interface Input {
    readonly id?: string | undefined
    readonly hidden?: boolean | undefined
    readonly style?: CssStyle | undefined
  }

  /** Содержимое предоставляется вызывающей стороной в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = JSX.Element<Slots>
}
