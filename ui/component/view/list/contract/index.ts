import type {ImmersiveUiComponentView} from "@zavx0z/immersive-ui-component-view/contract"
import type {ListItem} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentViewList {
  /**
  Входные данные List.
  */
  interface Input {
    readonly items: readonly ListItem[]
    readonly selectedKey?: string | null | undefined
    readonly disabled?: boolean | undefined
    readonly dense?: boolean | undefined
    readonly variant?: "standalone" | "embedded" | undefined
    readonly emptyLabel?: string | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
    readonly onSelect?: ((key: string, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentView.Output & JSX.Element
}
