import type {Zavx0zImmersiveUiComponentFieldSelect} from "@zavx0z/immersive-ui-component-field-select"
type SelectFieldProps = Zavx0zImmersiveUiComponentFieldSelect.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterChoiceSelect {
  /**
  Входные данные параметра выбора, связанного с нодой и её сокетами.

  Варианты и особое состояние выбора принадлежат вызывающей стороне и передаются публичному `SelectField`.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Значение выбранного варианта.

  @property [options] - Полный доступный набор вариантов.

  @property [state] - Особое состояние выбора, например отсутствие значения.

  @example
  ```ts
  const input: Zavx0zImmersiveNodesParameterChoiceSelect.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly value: SelectFieldProps["value"]
    readonly options?: SelectFieldProps["options"]
    readonly state?: SelectFieldProps["state"]
    readonly density?: SelectFieldProps["density"]
    readonly onChange?: SelectFieldProps["onChange"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
