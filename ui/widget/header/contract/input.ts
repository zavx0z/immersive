import type {WidgetAction} from "./types.ts"
import type {UiBadge} from "@ui/badge"

/**
Входные данные WidgetHeader.
*/
export interface WidgetHeaderProps {
  readonly title: string
  readonly subtitle?: string | undefined
  readonly status?: string | undefined
  readonly statusTone?: UiBadge.Input["tone"] | undefined
  readonly actions?: readonly WidgetAction[] | undefined
}
