import type {Zavx0zImmersiveUiComponentSurfaceChrome} from "@zavx0z/immersive-ui-component-surface-chrome/contract"


import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace Zavx0zImmersiveUiComponentSurfaceChromeBody {
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

  type Output = Zavx0zImmersiveUiComponentSurfaceChrome.Output & JSX.Element<Slots>
}
