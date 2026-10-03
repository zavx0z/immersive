import type {TreeHandle} from "./types.ts"
import type {TreeItem} from "./types.ts"
import type {UiWidgetsHeader} from "@ui-widgets/header"
type WidgetHeaderProps = UiWidgetsHeader.Input

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiWidgetsTree {
  /**
  Входные данные Tree.
  */
  type Input = WidgetHeaderProps & Readonly<{
    items: readonly TreeItem[]
    expandedKeys: readonly string[]
    selectedKeys: readonly string[]
    selectionMode?: "single" | "multiple" | undefined
    emptyLabel?: string | undefined
    onExpandedChange?: ((keys: readonly string[], event: Event) => void) | undefined
    onSelectionChange?: ((keys: readonly string[], event: Event) => void) | undefined
    onActivate?: ((id: string, event: Event) => void) | undefined
    onReady?: ((handle: TreeHandle | null) => void) | undefined
    /** Встраивает дерево в панель вызывающего компонента без собственного заголовка. */
    embedded?: boolean | undefined
    /** При false стрелки перемещают только фокус, не изменяя выбор. */
    selectionFollowsFocus?: boolean | undefined
    /** Ограничивает число смонтированных строк большой иерархии. */
    windowing?: Readonly<{
      size: number
      rowHeight: number
      overscan?: number
      viewRows?: number
      resetKey?: string
      retainedItems?: readonly TreeItem[]
    }> | undefined
    style?: CssStyle | undefined
  }>

  type Output = JSX.Element
}
