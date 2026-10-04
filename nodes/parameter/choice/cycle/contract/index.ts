import type {ImmersiveUiComponentFieldCycle} from "@immersive-ui-component-field/cycle"
type CycleFieldProps = ImmersiveUiComponentFieldCycle.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterChoiceCycle {
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
  const input: ImmersiveNodesParameterChoiceCycle.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: CycleFieldProps["value"]
    readonly options: CycleFieldProps["options"]
    readonly density?: CycleFieldProps["density"]
    readonly open?: CycleFieldProps["open"]
    readonly onChange?: CycleFieldProps["onChange"]
    readonly onOpenChange?: CycleFieldProps["onOpenChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
