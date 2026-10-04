import type {ImmersiveUiComponentFieldCheckbox} from "@zavx0z/immersive-ui-component-field-checkbox"
type CheckboxFieldProps = ImmersiveUiComponentFieldCheckbox.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterBooleanCheckbox {
  /**
  Входные данные логического параметра-флажка, связанного с нодой и её сокетами.

  Смешанное отображение не заменяет логическое значение; запрос изменения передаётся владельцу.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property checked - Текущее логическое значение.

  @property [indeterminate] - Показывает смешанное состояние без изменения `checked`.

  @property [onChange] - Передаёт предложенное логическое значение.

  @example
  ```ts
  const input: ImmersiveNodesParameterBooleanCheckbox.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    checked: true,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly checked: CheckboxFieldProps["checked"]
    readonly indeterminate?: CheckboxFieldProps["indeterminate"]
    readonly onChange?: CheckboxFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
