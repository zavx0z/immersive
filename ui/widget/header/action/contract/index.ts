import type {UiWidgetsHeader} from "@ui-widgets/header"
type WidgetAction = NonNullable<UiWidgetsHeader.Input["actions"]>[number]

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiWidgetsHeaderAction {
  /** Действие заголовка и политика передачи события родительскому виджету. */
  interface Input {
    readonly action: WidgetAction
    readonly stopPropagation?: boolean
  }

  type Output = JSX.Element
}
