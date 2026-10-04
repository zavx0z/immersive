import type {Zavx0zImmersiveUiComponentSurfaceChrome} from "@zavx0z/immersive-ui-component-surface-chrome/contract"


import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace Zavx0zImmersiveUiComponentSurfaceChromeTitle {
  /**
  Входные данные SurfaceTitle.
  */
  interface Input {
    readonly text: string
    readonly variant?: "title" | "subtitle" | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = Zavx0zImmersiveUiComponentSurfaceChrome.Output & JSX.Element
}
