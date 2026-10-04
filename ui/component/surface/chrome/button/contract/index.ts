import type {ImmersiveUiComponentSurfaceChrome} from "@zavx0z/immersive-ui-component-surface-chrome/contract"
import type {ImmersiveUiComponentButtonBasic} from "@zavx0z/immersive-ui-component-button-basic"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentSurfaceChromeButton {
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
    readonly onClick?: ImmersiveUiComponentButtonBasic.Input["onClick"]
  }

  type Output = ImmersiveUiComponentSurfaceChrome.Output & JSX.Element
}
