import type {UiSurfaces} from "@ui/surfaces/contract"
import type {PanelAction} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiSurfacesPanel {
  /**
  Входные данные Panel.
  */
  interface Input {
    readonly label: string
    readonly title?: string | undefined
    readonly expanded: boolean
    readonly hidden?: boolean | undefined
    readonly actions?: readonly PanelAction[] | undefined
    readonly style?: CssStyle | undefined
    readonly onToggle?: ((expanded: boolean, event: Event) => void) | undefined
  }

  /** Содержимое вызывающей стороны размещается в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = UiSurfaces.Output & JSX.Element<Slots>
}
