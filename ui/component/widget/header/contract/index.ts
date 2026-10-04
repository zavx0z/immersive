import type {ImmersiveUiComponentWidget} from "@immersive-ui-component/widget/contract"
import type {WidgetAction} from "./types.ts"
import type {ImmersiveUiComponentBadge} from "@immersive-ui-component/badge"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentWidgetHeader {
  /**
  Входные данные WidgetHeader.
  */
  interface Input {
    readonly title: string
    readonly subtitle?: string | undefined
    readonly status?: string | undefined
    readonly statusTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
    readonly actions?: readonly WidgetAction[] | undefined
  }

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element
}
