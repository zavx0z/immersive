import type {ImmersiveUiComponentSurface} from "@zavx0z/immersive-ui-component-surface/contract"
import type {PaneTextContent} from "./types.ts"
import type {PaneVariant} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentSurfacePane {
  /**
  Входные данные Pane.
  */
  interface Input {
    readonly content?: PaneTextContent
    readonly variant?: PaneVariant | undefined
    readonly title?: string | undefined
    readonly active?: boolean | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = ImmersiveUiComponentSurface.Output & JSX.Element
}
