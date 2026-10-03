import SurfaceButton from "@ui-surfaces-chrome/button"
import type {UiSurfacesWindow} from "../contract/index"
type WindowProps = UiSurfacesWindow.Input
import type {WindowAction} from "../contract/types"

/** Кнопка правой группы сохраняет обычный ввод и не начинает перемещение окна. */
export function WindowActionButton(props: Readonly<{action: WindowAction; onAction: WindowProps["onAction"]}>) {
  return <SurfaceButton
    label={props.action.label}
    iconSrc={props.action.iconSrc}
    iconOnly={props.action.iconSrc !== undefined}
    iconAction={props.action.iconSrc !== undefined}
    title={props.action.label}
    ariaLabel={props.action.label}
    disabled={props.action.disabled}
    onClick={event => props.onAction?.(props.action.key, event)}
  />
}
