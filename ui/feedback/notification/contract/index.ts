import type {UiFeedback} from "@ui/feedback/contract"
import type {NotificationTone} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiFeedbackNotification {
  /**
  Входные данные Notification.
  */
  interface Input {
    readonly message: string
    readonly heading?: string | undefined
    readonly detail?: string | undefined
    readonly tone?: NotificationTone | undefined
    readonly dismissible?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
    readonly onDismiss?: ((event: Event) => void) | undefined
  }

  type Output = UiFeedback.Output & JSX.Element
}
