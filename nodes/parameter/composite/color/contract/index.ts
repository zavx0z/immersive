import type {Zavx0zImmersiveUiComponentFieldColor} from "@zavx0z/immersive-ui-component-field-color"
type ColorFieldProps = Zavx0zImmersiveUiComponentFieldColor.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterCompositeColor {
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
  const input: Zavx0zImmersiveNodesParameterCompositeColor.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: {r: 1, g: 0, b: 0, a: 1},
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly value: ColorFieldProps["value"]
    readonly open?: ColorFieldProps["open"]
    readonly onInput?: ColorFieldProps["onInput"]
    readonly onChange?: ColorFieldProps["onChange"]
    readonly onOpenChange?: ColorFieldProps["onOpenChange"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
