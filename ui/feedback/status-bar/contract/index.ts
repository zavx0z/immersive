import type {StatusBarItem} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiFeedbackStatusBar {
  /**
  Входные данные StatusBar.
  */
  interface Input {
    readonly start?: readonly StatusBarItem[] | undefined
    readonly end?: readonly StatusBarItem[] | undefined
    readonly separator?: string | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Содержимое вызывающей стороны размещается в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = JSX.Element<Slots>
}
