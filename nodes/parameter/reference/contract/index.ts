import type {ImmersiveUiComponentFieldReference} from "@zavx0z/immersive-ui-component-field-reference"
type ReferenceFieldProps = ImmersiveUiComponentFieldReference.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterReference {
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
  const input: ImmersiveNodesParameterReference.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: null,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: ReferenceFieldProps["value"]
    readonly placeholder?: ReferenceFieldProps["placeholder"]
    readonly density?: ReferenceFieldProps["density"]
    readonly onActivate?: ReferenceFieldProps["onActivate"]
    readonly onPick?: ReferenceFieldProps["onPick"]
    readonly onClear?: ReferenceFieldProps["onClear"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
