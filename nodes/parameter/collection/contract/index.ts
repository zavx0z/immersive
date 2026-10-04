import type {ImmersiveUiComponentFieldCollection} from "@zavx0z/immersive-ui-component-field-collection"
type CollectionFieldProps = ImmersiveUiComponentFieldCollection.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterCollection {
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
  const input: ImmersiveNodesParameterCollection.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    items: [],
    selectedId: null,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
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

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
