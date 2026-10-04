import type {ImmersiveUiComponentFieldSelect} from "@zavx0z/immersive-ui-component-field-select"
type SelectFieldProps = ImmersiveUiComponentFieldSelect.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterChoiceSelect {
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
  const input: ImmersiveNodesParameterChoiceSelect.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: SelectFieldProps["value"]
    readonly options?: SelectFieldProps["options"]
    readonly state?: SelectFieldProps["state"]
    readonly density?: SelectFieldProps["density"]
    readonly onChange?: SelectFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
