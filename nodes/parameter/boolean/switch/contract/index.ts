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

  @property nodeId - Идентификатор ноды для адресов всех сокетов строки.

  @property [sockets] - Адресуемые сокеты параметра с уже выбранными сторонами.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property [onSocketActivate] - Получает исходный идентификатор сокета.

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

  type Output = NodesParameters.Output & JSX.Element
}
