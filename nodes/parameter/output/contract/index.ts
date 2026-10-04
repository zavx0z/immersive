import type {NodeJsonValue} from "@immersive-nodes/tree"
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterOutput {
  /**
  Входные данные выходного параметра только для чтения, связанного с нодой и её сокетами.

  Значение показывается как текст или JSON; направление соединения задаётся сокетом.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Отображаемое JSON-значение без локального редактирования.

  @example
  ```ts
  const input: ImmersiveNodesParameterOutput.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: null,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: NodeJsonValue
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
