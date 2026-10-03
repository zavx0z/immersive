import type {UiFieldsCheckboxField} from "@ui-fields/checkbox-field"
type CheckboxFieldProps = UiFieldsCheckboxField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersCheckbox {
  /**
  Входные данные логического параметра-флажка, связанного с нодой и её сокетами.

  Смешанное отображение не заменяет логическое значение; запрос изменения передаётся владельцу.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property checked - Текущее логическое значение.

  @property [indeterminate] - Показывает смешанное состояние без изменения `checked`.

  @property [onChange] - Передаёт предложенное логическое значение.

  @example
  ```ts
  const input: NodesParametersCheckbox.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    checked: true,
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly checked: CheckboxFieldProps["checked"]
    readonly indeterminate?: CheckboxFieldProps["indeterminate"]
    readonly onChange?: CheckboxFieldProps["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
