import type {Zavx0zImmersiveUiComponentFieldNumber} from "@zavx0z/immersive-ui-component-field-number"
type NumberFieldProps = Zavx0zImmersiveUiComponentFieldNumber.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterNumericNumber {
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
  const input: Zavx0zImmersiveNodesParameterNumericNumber.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: 1,
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
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

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
