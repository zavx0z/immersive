import type {ImmersiveUiComponentFieldNumber} from "@immersive-ui-component-field/number"
type NumberFieldProps = ImmersiveUiComponentFieldNumber.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterNumericNumber {
  /**
  Входные данные числового параметра, связанного с нодой и её сокетами.

  Жёсткие `min`/`max` и мягкие границы перетаскивания передаются публичному `NumberField`; компонент не хранит число.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Текущее конечное числовое значение.

  @property [softMin] - Мягкая нижняя граница перетаскивания.

  @property [softMax] - Мягкая верхняя граница перетаскивания.

  @example
  ```ts
  const input: ImmersiveNodesParameterNumericNumber.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: 1,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: NumberFieldProps["value"]
    readonly min?: NumberFieldProps["min"]
    readonly max?: NumberFieldProps["max"]
    readonly softMin?: NumberFieldProps["softMin"]
    readonly softMax?: NumberFieldProps["softMax"]
    readonly step?: NumberFieldProps["step"]
    readonly precision?: NumberFieldProps["precision"]
    readonly onInput?: NumberFieldProps["onInput"]
    readonly onChange?: NumberFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
