import type {UiFieldsReferenceField} from "@ui-fields/reference-field"
type ReferenceFieldProps = UiFieldsReferenceField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersReference {
  /**
  Входные данные ссылочного параметра, связанного с нодой и её сокетами.

  Идентификатор и подпись выбранного объекта принадлежат приложению; выбор и очистка возвращаются callbacks.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Выбранная ссылка либо `null`.

  @property [onPick] - Запрашивает выбор объекта у приложения.

  @property [onClear] - Запрашивает очистку ссылки.

  @example
  ```ts
  const input: NodesParametersReference.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: null,
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: ReferenceFieldProps["value"]
    readonly placeholder?: ReferenceFieldProps["placeholder"]
    readonly density?: ReferenceFieldProps["density"]
    readonly onActivate?: ReferenceFieldProps["onActivate"]
    readonly onPick?: ReferenceFieldProps["onPick"]
    readonly onClear?: ReferenceFieldProps["onClear"]
  }

  interface Slots extends NodesParameters.Slots {}

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
