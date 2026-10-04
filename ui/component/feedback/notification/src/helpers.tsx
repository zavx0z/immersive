import type {ImmersiveUiComponentFeedbackNotification} from "../contract/index"
type NotificationProps = ImmersiveUiComponentFeedbackNotification.Input

/** Частная подготовка уведомление о событии с действиями и закрытием. */
export function assertNotificationProps(props: NotificationProps): void {
  if (typeof props.message !== "string" || props.message.length === 0) invalidNotificationProps()
  if (props.heading !== undefined && typeof props.heading !== "string") invalidNotificationProps()
  if (props.detail !== undefined && typeof props.detail !== "string") invalidNotificationProps()
  if (props.tone !== undefined && props.tone !== "info" && props.tone !== "success" && props.tone !== "warning" && props.tone !== "error") {
    invalidNotificationProps()
  }
}

/** Частная подготовка уведомление о событии с действиями и закрытием. */
export function invalidNotificationProps(): never {
  throw new TypeError("Invalid Notification props")
}
