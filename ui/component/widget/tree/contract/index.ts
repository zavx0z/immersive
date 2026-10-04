import type {ImmersiveUiComponentWidget} from "@immersive-ui-component/widget/contract"
import type {TreeHandle} from "./types.ts"
import type {TreeItem} from "./types.ts"
import type {ImmersiveUiComponentWidgetHeader} from "@immersive-ui-component-widget/header"
type WidgetHeaderProps = ImmersiveUiComponentWidgetHeader.Input

import type {JSX} from "@immersive-jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentWidgetTree {
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

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element
}
