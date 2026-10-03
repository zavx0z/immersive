

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiSurfacesChromeOwner {
  /**
  Входные данные SurfaceOwner.
  */
  interface Input {
    readonly label: string
    readonly active?: boolean | undefined
    readonly timeline?: boolean | undefined
    readonly frameStart?: number | undefined
    readonly frameEnd?: number | undefined
    readonly frameCurrent?: number | undefined
    readonly style?: CssStyle | undefined
  }

  /** Содержимое предоставляется вызывающей стороной в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = JSX.Element<Slots>
}
