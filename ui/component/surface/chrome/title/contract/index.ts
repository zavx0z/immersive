import type {ImmersiveUiComponentSurfaceChrome} from "@immersive-ui-component-surface/chrome/contract"


import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentSurfaceChromeTitle {
  /**
  Входные данные SurfaceTitle.
  */
  interface Input {
    readonly text: string
    readonly variant?: "title" | "subtitle" | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = ImmersiveUiComponentSurfaceChrome.Output & JSX.Element
}
