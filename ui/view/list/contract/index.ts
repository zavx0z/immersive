import type {ListItem} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiViewsList {
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

  type Output = JSX.Element
}
