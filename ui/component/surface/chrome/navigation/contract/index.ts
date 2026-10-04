import type {ImmersiveUiComponentSurfaceChrome} from "@immersive-ui-component-surface/chrome/contract"


import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentSurfaceChromeNavigation {
  /**
  Входные данные SurfaceNavigation.
  */
  interface Input {
    readonly label: string
    readonly style?: CssStyle | undefined
  }

  /** Содержимое предоставляется вызывающей стороной в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentSurfaceChrome.Output & JSX.Element<Slots>
}
