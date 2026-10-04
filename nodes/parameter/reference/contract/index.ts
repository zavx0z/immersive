import type {Zavx0zImmersiveUiComponentFieldReference} from "@zavx0z/immersive-ui-component-field-reference"
type ReferenceFieldProps = Zavx0zImmersiveUiComponentFieldReference.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterReference {
  /**
  Входные данные ссылочного параметра, связанного с нодой и её сокетами.

  Идентификатор и подпись выбранного объекта принадлежат приложению; выбор и очистка возвращаются callbacks.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Выбранная ссылка либо `null`.

  @property [onPick] - Запрашивает выбор объекта у приложения.

  @property [onClear] - Запрашивает очистку ссылки.

  @example
  ```ts
  const input: Zavx0zImmersiveNodesParameterReference.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: null,
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly value: ReferenceFieldProps["value"]
    readonly placeholder?: ReferenceFieldProps["placeholder"]
    readonly density?: ReferenceFieldProps["density"]
    readonly onActivate?: ReferenceFieldProps["onActivate"]
    readonly onPick?: ReferenceFieldProps["onPick"]
    readonly onClear?: ReferenceFieldProps["onClear"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
