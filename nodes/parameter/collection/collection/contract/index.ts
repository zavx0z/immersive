import type {UiFieldsCollectionField} from "@ui-fields/collection-field"
type CollectionFieldProps = UiFieldsCollectionField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersCollection {
  /**
  Входные данные параметра-коллекции, связанного с нодой и её сокетами.

  Список, выбор и порядок принадлежат вызывающей стороне; операции только передаются приложению.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Идентификатор ноды для адресов всех сокетов строки.

  @property [sockets] - Адресуемые сокеты параметра с уже выбранными сторонами.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property [onSocketActivate] - Получает исходный идентификатор сокета.

  @property items - Внешний упорядоченный список элементов.

  @property selectedId - Идентификатор выбранного элемента либо `null`.

  @property [onMove] - Запрашивает перестановку элемента.

  @example
  ```ts
  const input: NodesParametersCollection.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    items: [],
    selectedId: null,
  }
  ```
  */
  interface Input extends NodesParameters.Input {
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

  type Output = NodesParameters.Output & JSX.Element
}
