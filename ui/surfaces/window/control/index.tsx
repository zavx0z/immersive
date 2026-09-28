/**
WindowControl — элемент управления видимостью Window.
Кнопка получает общее с оболочкой состояние и не зависит от места размещения:
в статус-баре она остаётся видимой, внутри Tab может показываться только при свёрнутом окне.

@packageDocumentation
*/
import {Button} from "../../../buttons/button.tsx"
import type {WindowControlProps} from "./contract/input.ts"
export type {WindowControlProps} from "./contract/input.ts"

/** Переключает видимость и связывает доступное управление с id оболочки. */
export function WindowControl(props: WindowControlProps) {
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
