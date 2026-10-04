import type {Zavx0zImmersiveUiComponentButtonToggleGroup} from "@zavx0z/immersive-ui-component-button-toggle-group"
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterChoiceOptionGroup {
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
  const input: Zavx0zImmersiveNodesParameterChoiceOptionGroup.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "first",
    options: [],
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly value: Zavx0zImmersiveUiComponentButtonToggleGroup.Input["value"]
    readonly options: Zavx0zImmersiveUiComponentButtonToggleGroup.Input["options"]
    readonly density?: Zavx0zImmersiveUiComponentButtonToggleGroup.Input["density"]
    readonly onChange?: Zavx0zImmersiveUiComponentButtonToggleGroup.Input["onChange"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
