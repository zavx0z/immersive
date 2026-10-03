import type {UiFieldsCycleField} from "@ui-fields/cycle-field"
type CycleFieldProps = UiFieldsCycleField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersCycle {
  /**
  Входные данные циклического выбора, связанного с нодой и её сокетами.

  Список вариантов и управляемое состояние раскрытия передаются публичному `CycleField`.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Идентификатор ноды для адресов всех сокетов строки.

  @property [sockets] - Адресуемые сокеты параметра с уже выбранными сторонами.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property [onSocketActivate] - Получает исходный идентификатор сокета.

  @property value - Ключ текущего варианта.

  @property options - Упорядоченный набор вариантов.

  @property [open] - Управляемая видимость списка.

  @example
  ```ts
  const input: NodesParametersCycle.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: CycleFieldProps["value"]
    readonly options: CycleFieldProps["options"]
    readonly density?: CycleFieldProps["density"]
    readonly open?: CycleFieldProps["open"]
    readonly onChange?: CycleFieldProps["onChange"]
    readonly onOpenChange?: CycleFieldProps["onOpenChange"]
  }

  type Output = NodesParameters.Output & JSX.Element
}
