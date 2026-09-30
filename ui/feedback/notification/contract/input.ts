import type {NotificationTone} from "./types.ts"

/**
Входные данные Notification.
*/
export interface NotificationProps {
  readonly message: string
  readonly heading?: string | undefined
  readonly detail?: string | undefined
  readonly tone?: NotificationTone | undefined
  readonly dismissible?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onDismiss?: ((event: Event) => void) | undefined
}
