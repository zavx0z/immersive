import type {Zavx0zImmersiveUiComponentFieldCycle} from "@zavx0z/immersive-ui-component-field-cycle"
type CycleFieldProps = Zavx0zImmersiveUiComponentFieldCycle.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterChoiceCycle {
  /**
  Входные данные циклического выбора, связанного с нодой и её сокетами.

  Список вариантов и управляемое состояние раскрытия передаются публичному `CycleField`.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Ключ текущего варианта.

  @property options - Упорядоченный набор вариантов.

  @property [open] - Управляемая видимость списка.

  @example
  ```ts
  const input: Zavx0zImmersiveNodesParameterChoiceCycle.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly value: CycleFieldProps["value"]
    readonly options: CycleFieldProps["options"]
    readonly density?: CycleFieldProps["density"]
    readonly open?: CycleFieldProps["open"]
    readonly onChange?: CycleFieldProps["onChange"]
    readonly onOpenChange?: CycleFieldProps["onOpenChange"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
