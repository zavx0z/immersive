import type {WidgetAction} from "./types.ts"
import type {BadgeTone} from "@ui/badge"

/**
Входные данные WidgetHeader.
*/
export interface WidgetHeaderProps {
  readonly title: string
  readonly subtitle?: string | undefined
  readonly status?: string | undefined
  readonly statusTone?: BadgeTone | undefined
  readonly actions?: readonly WidgetAction[] | undefined
}
