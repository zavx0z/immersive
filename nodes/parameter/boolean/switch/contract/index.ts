import type {UiFieldsSwitchField} from "@ui-fields/switch-field"
type SwitchFieldProps = UiFieldsSwitchField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersSwitch {
  /**
  Входные данные логического параметра-переключателя, связанного с нодой и её сокетами.

  Текущее значение остаётся у вызывающей стороны; компонент только возвращает запрос переключения.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property checked - Текущее логическое значение.

  @property [onChange] - Передаёт предложенное значение без записи во внешний Store.

  @example
  ```ts
  const input: NodesParametersSwitch.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    checked: true,
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly checked: SwitchFieldProps["checked"]
    readonly onChange?: SwitchFieldProps["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
