import type {UiFieldsSelectField} from "@ui-fields/select-field"
type SelectFieldProps = UiFieldsSelectField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersSelect {
  /**
  Входные данные параметра выбора, связанного с нодой и её сокетами.

  Варианты и особое состояние выбора принадлежат вызывающей стороне и передаются публичному `SelectField`.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Значение выбранного варианта.

  @property [options] - Полный доступный набор вариантов.

  @property [state] - Особое состояние выбора, например отсутствие значения.

  @example
  ```ts
  const input: NodesParametersSelect.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: SelectFieldProps["value"]
    readonly options?: SelectFieldProps["options"]
    readonly state?: SelectFieldProps["state"]
    readonly density?: SelectFieldProps["density"]
    readonly onChange?: SelectFieldProps["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
