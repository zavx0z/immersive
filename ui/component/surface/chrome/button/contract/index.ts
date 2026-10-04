import type {Zavx0zImmersiveUiComponentSurfaceChrome} from "@zavx0z/immersive-ui-component-surface-chrome/contract"
import type {Zavx0zImmersiveUiComponentButtonBasic} from "@zavx0z/immersive-ui-component-button-basic"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace Zavx0zImmersiveUiComponentSurfaceChromeButton {
  /**
  Входные данные SurfaceButton.
  */
  interface Input {
    readonly label: string
    readonly iconSrc?: string | undefined
    readonly iconOnly?: boolean | undefined
    readonly iconAction?: boolean | undefined
    readonly title?: string | undefined
    readonly ariaLabel?: string | undefined
    readonly expanded?: boolean | string | undefined
    readonly controls?: string | undefined
    readonly disabled?: boolean | undefined
    readonly style?: CssStyle | undefined
    readonly onClick?: Zavx0zImmersiveUiComponentButtonBasic.Input["onClick"]
  }

  type Output = Zavx0zImmersiveUiComponentSurfaceChrome.Output & JSX.Element
}
