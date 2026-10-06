import Notification from "@zavx0z/immersive-ui-component-feedback-notification"
import type {ImmersiveUiComponentSurfaceWindow} from "../contract"

/** Непрокручиваемое сообщение принадлежит оболочке и скрывается вместе с окном. */
export function WindowMessage(props: Readonly<{
  value: NonNullable<ImmersiveUiComponentSurfaceWindow.Input["message"]>
  onDismiss?: ((event: Event) => void) | undefined
}>) {
  return <footer
    data-window-message=""
    style={css`
      display: flex;
      flex-shrink: 0;
      justify-content: flex-start;
      box-sizing: border-box;
      min-width: 0;
      padding: 6px;
    `}
  >
    <Notification
      message={props.value.message}
      heading={props.value.heading}
      detail={props.value.detail}
      tone={props.value.tone}
      dismissible={props.onDismiss !== undefined}
      onDismiss={props.onDismiss}
      style={css`
        max-width: 100%;
      `}
    />
  </footer>
}
