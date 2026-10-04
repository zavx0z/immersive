import type {ImmersiveUiComponentButtonToggleGroup} from "@zavx0z/immersive-ui-component-button-toggle-group"
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterChoiceOptionGroup {
  /**
  Входные данные группы вариантов, связанного с нодой и её сокетами.

  Группа показывает внешний набор вариантов и возвращает выбранное строковое значение.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Значение выбранного варианта.

  @property options - Полный набор кнопок выбора.

  @property [onChange] - Передаёт новое выбранное значение.

  @example
  ```ts
  const input: ImmersiveNodesParameterChoiceOptionGroup.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: ImmersiveUiComponentButtonToggleGroup.Input["value"]
    readonly options: ImmersiveUiComponentButtonToggleGroup.Input["options"]
    readonly density?: ImmersiveUiComponentButtonToggleGroup.Input["density"]
    readonly onChange?: ImmersiveUiComponentButtonToggleGroup.Input["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
