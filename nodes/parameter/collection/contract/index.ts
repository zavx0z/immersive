import type {Zavx0zImmersiveUiComponentFieldCollection} from "@zavx0z/immersive-ui-component-field-collection"
type CollectionFieldProps = Zavx0zImmersiveUiComponentFieldCollection.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterCollection {
  /**
  Входные данные параметра-коллекции, связанного с нодой и её сокетами.

  Список, выбор и порядок принадлежат вызывающей стороне; операции только передаются приложению.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property items - Внешний упорядоченный список элементов.

  @property selectedId - Идентификатор выбранного элемента либо `null`.

  @property [onMove] - Запрашивает перестановку элемента.

  @example
  ```ts
  const input: Zavx0zImmersiveNodesParameterCollection.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    items: [],
    selectedId: null,
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly items: CollectionFieldProps["items"]
    readonly selectedId: CollectionFieldProps["selectedId"]
    readonly visibleRows?: CollectionFieldProps["visibleRows"]
    readonly emptyLabel?: CollectionFieldProps["emptyLabel"]
    readonly density?: CollectionFieldProps["density"]
    readonly onSelect?: CollectionFieldProps["onSelect"]
    readonly onAdd?: CollectionFieldProps["onAdd"]
    readonly onRemove?: CollectionFieldProps["onRemove"]
    readonly onMove?: CollectionFieldProps["onMove"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
