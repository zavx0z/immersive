import type {ImmersiveUiComponentFeedback} from "@zavx0z/immersive-ui-component-feedback/contract"
import type {NotificationTone} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentFeedbackNotification {
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

  type Output = ImmersiveUiComponentFeedback.Output & JSX.Element
}
