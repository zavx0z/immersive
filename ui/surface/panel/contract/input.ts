import type {PanelAction} from "./types.ts"

/**
Входные данные Panel.
*/
export interface PanelProps {
  readonly label: string
  readonly title?: string | undefined
  readonly expanded: boolean
  readonly hidden?: boolean | undefined
  readonly actions?: readonly PanelAction[] | undefined
  readonly style?: CssStyle | undefined
  readonly onToggle?: ((expanded: boolean, event: Event) => void) | undefined
}
