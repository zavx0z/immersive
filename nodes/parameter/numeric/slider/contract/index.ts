import type {ImmersiveUiComponentFieldSlider} from "@immersive-ui-component-field/slider"
type SliderFieldProps = ImmersiveUiComponentFieldSlider.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterNumericSlider {
  /**
  Входные данные параметра-ползунка, связанного с нодой и её сокетами.

  Диапазон принадлежит вызывающей стороне; компонент передаёт ввод и подтверждение без локальной копии значения.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Текущее значение внутри объявленного диапазона.

  @property min - Нижняя граница ползунка.

  @property max - Верхняя граница ползунка.

  @example
  ```ts
  const input: ImmersiveNodesParameterNumericSlider.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: 0.5,
    min: 0,
    max: 1,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: SliderFieldProps["value"]
    readonly min: SliderFieldProps["min"]
    readonly max: SliderFieldProps["max"]
    readonly step?: SliderFieldProps["step"]
    readonly density?: SliderFieldProps["density"]
    readonly onInput?: SliderFieldProps["onInput"]
    readonly onChange?: SliderFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
