/**
WindowControl — элемент управления видимостью Window.
Кнопка получает общее с оболочкой состояние и не зависит от места размещения:
в статус-баре она остаётся видимой, внутри Tab может показываться только при свёрнутом окне.

@packageDocumentation
*/
import Button from "@immersive-ui-component-button/basic"
import type {ImmersiveUiComponentSurfaceWindowControl as Contract} from "./contract"

export type {ImmersiveUiComponentSurfaceWindowControl} from "./contract"


export default function WindowControl(props: Contract.Input): Contract.Output {
  return <Button
    label={props.label}
    aria-label={props.label}
    title={props.open ? `Скрыть ${props.label}` : `Открыть ${props.label}`}
    aria-expanded={String(props.open)}
    aria-controls={props.windowId}
    selected={props.open}
    disabled={props.disabled}
    size="small"
    style={css`${props.style}`}
    onClick={event => props.onOpenChange(!props.open, event)}
  />
}
