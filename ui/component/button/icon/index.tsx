/**
Квадратная кнопка действия со значком и доступным названием.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import Button from "@ui-buttons/button"
import type {UiButtonsIconButton} from "./contract"


export type {UiButtonsIconButton} from "./contract"

export default function IconButton(props: UiButtonsIconButton.Input): UiButtonsIconButton.Output {
  return <Button
    label={props.label}
    iconSrc={props.iconSrc}
    iconPosition="start"
    iconOnly={true}
    iconSize={props.iconSize}
    variant={props.variant ?? "text"}
    tone={props.tone}
    size={props.size}
    disabled={props.disabled}
    selected={props.selected}
    title={props.title ?? props.label}
    aria-label={props.label}
    style={props.style}
    onClick={props.onClick}
  />
}
