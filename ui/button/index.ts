/**
Кнопочные элементы объединены протоколом доступной подписи, запрета действия
и JSX-представления. Каждый участник сохраняет собственную реализацию:
Button выполняет действие, IconButton показывает его значок,
ToggleButtonGroup выбирает одно значение из набора.

@packageDocumentation
*/
export type {UiButtons} from "./contract"
export {default as Button} from "@ui-buttons/button"
export type {UiButtonsButton} from "@ui-buttons/button"
export {default as IconButton} from "@ui-buttons/icon-button"
export type {UiButtonsIconButton} from "@ui-buttons/icon-button"
export {default as ToggleButtonGroup} from "@ui-buttons/toggle-button-group"
export type {UiButtonsToggleButtonGroup} from "@ui-buttons/toggle-button-group"
