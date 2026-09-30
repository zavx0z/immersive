import type {WidgetAction} from "@ui-widgets/header"

/** Действие заголовка и политика передачи события родительскому виджету. */
export interface WidgetActionButtonProps {
  readonly action: WidgetAction
  readonly stopPropagation?: boolean
}
