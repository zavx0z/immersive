import type {UiFieldsColorField} from "@ui-fields/color-field"
type ColorFieldProps = UiFieldsColorField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersColor {
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
  const input: NodesParametersColor.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: {r: 1, g: 0, b: 0, a: 1},
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: ColorFieldProps["value"]
    readonly open?: ColorFieldProps["open"]
    readonly onInput?: ColorFieldProps["onInput"]
    readonly onChange?: ColorFieldProps["onChange"]
    readonly onOpenChange?: ColorFieldProps["onOpenChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
