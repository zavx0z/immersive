import type {Zavx0zImmersiveUiComponentWidget} from "@zavx0z/immersive-ui-component-widget/contract"
import type {WidgetAction} from "./types.ts"
import type {Zavx0zImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace Zavx0zImmersiveUiComponentWidgetHeader {
  /**
  Входные данные WidgetHeader.
  */
  interface Input {
    readonly title: string
    readonly subtitle?: string | undefined
    readonly status?: string | undefined
    readonly statusTone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
    readonly actions?: readonly WidgetAction[] | undefined
  }

  type Output = Zavx0zImmersiveUiComponentWidget.Output & JSX.Element
}
