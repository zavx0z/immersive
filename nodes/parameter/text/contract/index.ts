import type {UiFieldsTextField} from "@ui-fields/text-field"
type TextFieldProps = UiFieldsTextField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersText {
  /**
  Входные данные строкового параметра, связанного с нодой и её сокетами.

  Поле сохраняет строку во внешнем состоянии; подключённый сокет скрывает редактор, но сохраняет подпись и адрес строки.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Текущее строковое значение.

  @property [type] - Режим ввода публичного `TextField`.

  @property [onInput] - Публикует промежуточное строковое значение.

  @example
  ```ts
  const input: NodesParametersText.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "текст",
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: TextFieldProps["value"]
    readonly type?: TextFieldProps["type"]
    readonly placeholder?: TextFieldProps["placeholder"]
    readonly onInput?: TextFieldProps["onInput"]
    readonly onChange?: TextFieldProps["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
