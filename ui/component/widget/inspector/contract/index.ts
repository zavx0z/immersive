import type {ImmersiveUiComponentWidget} from "@immersive-ui-component/widget/contract"
import type {InspectorAction} from "./types.ts"
import type {InspectorCategory} from "./types.ts"
import type {InspectorContext} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentWidgetInspector {
  /**
  Входные данные Inspector.
  */
  interface Input {
    readonly ariaLabel?: string | undefined
    readonly categoriesLabel?: string | undefined
    readonly categories: readonly InspectorCategory[]
    readonly selectedCategoryId: string
    readonly query: string
    /** Показывать поиск; по умолчанию true. При false панель действий сохраняется, если действия переданы. */
    readonly showSearch?: boolean | undefined
    readonly searchLabel?: string | undefined
    readonly searchPlaceholder?: string | undefined
    readonly toolbarLeadingActions?: readonly InspectorAction[] | undefined
    readonly toolbarActions?: readonly InspectorAction[] | undefined
    readonly context?: InspectorContext | undefined
    readonly style?: CssStyle | undefined
    readonly onCategoryChange?: ((id: string, event: Event) => void) | undefined
    readonly onQueryChange?: ((query: string, event: Event) => void) | undefined
  }

  /** Содержимое вызывающей стороны размещается в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element<Slots>
}
