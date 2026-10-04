import type {FrameEdge} from "../contract/types.ts"
import type {ImmersiveUiComponentSurfaceFrame} from "../contract"

/** Частный вход кнопки команды рамки. */
type FrameHandleButtonProps = Readonly<{
  handle: ImmersiveUiComponentSurfaceFrame.Input["handles"][number]
  onHandle?: ImmersiveUiComponentSurfaceFrame.Input["onHandle"]
}>
import SurfaceButton from "@zavx0z/immersive-ui-component-surface-chrome-button"

/** Частная подготовка рамка рабочей области с заголовком и элементами управления. */
export function FrameHandleButton(props: FrameHandleButtonProps) {
  const onClick = (event: Event) => props.onHandle?.(props.handle.key, event)
  return <SurfaceButton
    label={props.handle.label}
    iconSrc={props.handle.iconSrc}
    iconOnly={props.handle.iconSrc !== undefined}
    iconAction={props.handle.iconSrc !== undefined}
    title={props.handle.iconSrc === undefined ? undefined : props.handle.label}
    ariaLabel={props.handle.label}
    disabled={props.handle.disabled}
    onClick={onClick}
  />
}

/** Частная подготовка рамка рабочей области с заголовком и элементами управления. */
export function FrameEdgeIndicator(props: Readonly<{edge: FrameEdge}>) {
  return <span
    aria-hidden="true"
    data-edge={props.edge}
    style={css`
      position: absolute;
      display: block;
      background: var(--widget-toolbar-background-selected);

      &[data-edge="floating"] {
        display: none;
      }

      &[data-edge="left"] {
        left: 0;
        top: 0;
        width: 1px;
        height: 100%;
      }

      &[data-edge="right"] {
        right: 0;
        top: 0;
        width: 1px;
        height: 100%;
      }

      &[data-edge="top"] {
        left: 0;
        top: 0;
        width: 100%;
        height: 1px;
      }

      &[data-edge="bottom"] {
        left: 0;
        bottom: 0;
        width: 100%;
        height: 1px;
      }
    `}
  >
  </span>
}

/** Частная подготовка рамка рабочей области с заголовком и элементами управления. */
export function assertEdge(edge: FrameEdge): void {
  if (edge !== "floating" && edge !== "left" && edge !== "right" && edge !== "top" && edge !== "bottom") {
    throw new Error(`Unknown Frame edge: ${String(edge)}`)
  }
}
