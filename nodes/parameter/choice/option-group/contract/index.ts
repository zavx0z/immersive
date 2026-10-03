import type {UiButtonsToggleButtonGroup} from "@ui-buttons/toggle-button-group"
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersOptionGroup {
  /**
  Входные данные группы вариантов, связанного с нодой и её сокетами.

  Группа показывает внешний набор вариантов и возвращает выбранное строковое значение.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Значение выбранного варианта.

  @property options - Полный набор кнопок выбора.

  @property [onChange] - Передаёт новое выбранное значение.

  @example
  ```ts
  const input: NodesParametersOptionGroup.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: UiButtonsToggleButtonGroup.Input["value"]
    readonly options: UiButtonsToggleButtonGroup.Input["options"]
    readonly density?: UiButtonsToggleButtonGroup.Input["density"]
    readonly onChange?: UiButtonsToggleButtonGroup.Input["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
