import type {ImmersiveUiComponentFieldColor} from "@immersive-ui-component-field/color"
type ColorFieldProps = ImmersiveUiComponentFieldColor.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterCompositeColor {
  /**
  Входные данные цветового параметра, связанного с нодой и её сокетами.

  RGBA-значение и видимость панели выбора управляются вызывающей стороной.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Текущее RGBA-значение.

  @property [open] - Управляемая видимость панели выбора цвета.

  @property [onInput] - Передаёт промежуточный цвет.

  @example
  ```ts
  const input: ImmersiveNodesParameterCompositeColor.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: {r: 1, g: 0, b: 0, a: 1},
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: ColorFieldProps["value"]
    readonly open?: ColorFieldProps["open"]
    readonly onInput?: ColorFieldProps["onInput"]
    readonly onChange?: ColorFieldProps["onChange"]
    readonly onOpenChange?: ColorFieldProps["onOpenChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
