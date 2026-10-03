import type {UiWidgets} from "@ui/widgets/contract"
import type {WidgetAction} from "./types.ts"
import type {UiBadge} from "@ui/badge"

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiWidgetsHeader {
  /**
  Входные данные WidgetHeader.
  */
  interface Input {
    readonly title: string
    readonly subtitle?: string | undefined
    readonly status?: string | undefined
    readonly statusTone?: UiBadge.Input["tone"] | undefined
    readonly actions?: readonly WidgetAction[] | undefined
  }

  type Output = UiWidgets.Output & JSX.Element
}
