import type {NodeJsonValue} from "@nodes/tree"
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersOutput {
  /**
  Входные данные выходного параметра только для чтения, связанного с нодой и её сокетами.

  Значение показывается как текст или JSON; направление соединения задаётся сокетом.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Отображаемое JSON-значение без локального редактирования.

  @example
  ```ts
  const input: NodesParametersOutput.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: null,
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: NodeJsonValue
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
