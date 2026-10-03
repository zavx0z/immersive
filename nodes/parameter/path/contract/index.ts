import type {UiFieldsPathField} from "@ui-fields/path-field"
type PathFieldProps = UiFieldsPathField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersPath {
  /**
  Входные данные параметра пути, связанного с нодой и её сокетами.

  Компонент редактирует строку и запрашивает внешний выбор пути, не обращаясь к файловой системе.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Текущая строка пути.

  @property [onBrowse] - Запрашивает действие приложения по выбору пути.

  @property [onInput] - Передаёт промежуточную строку.

  @example
  ```ts
  const input: NodesParametersPath.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "./scene.glb",
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: PathFieldProps["value"]
    readonly placeholder?: PathFieldProps["placeholder"]
    readonly density?: PathFieldProps["density"]
    readonly browseTitle?: PathFieldProps["browseTitle"]
    readonly onInput?: PathFieldProps["onInput"]
    readonly onChange?: PathFieldProps["onChange"]
    readonly onBrowse?: PathFieldProps["onBrowse"]
  }

  interface Slots extends NodesParameters.Slots {}

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
