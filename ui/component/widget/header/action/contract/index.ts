import type {ImmersiveUiComponentWidgetHeader} from "@zavx0z/immersive-ui-component-widget-header"
type WidgetAction = NonNullable<ImmersiveUiComponentWidgetHeader.Input["actions"]>[number]

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentWidgetHeaderAction {
  /** Действие заголовка и политика передачи события родительскому виджету. */
  interface Input {
    readonly action: WidgetAction
    readonly stopPropagation?: boolean
  }

  type Output = JSX.Element
}
