import type {UiSurfacesChrome} from "@ui-surfaces/chrome/contract"


import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiSurfacesChromeTitle {
  /**
  Входные данные SurfaceTitle.
  */
  interface Input {
    readonly text: string
    readonly variant?: "title" | "subtitle" | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = UiSurfacesChrome.Output & JSX.Element
}
