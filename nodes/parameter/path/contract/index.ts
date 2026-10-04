import type {ImmersiveUiComponentFieldPath} from "@zavx0z/immersive-ui-component-field-path"
type PathFieldProps = ImmersiveUiComponentFieldPath.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterPath {
  /**
  Входные данные параметра пути, связанного с нодой и её сокетами.

  Компонент редактирует строку и запрашивает внешний выбор пути, не обращаясь к файловой системе.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Текущая строка пути.

  @property [onBrowse] - Запрашивает действие приложения по выбору пути.

  @property [onInput] - Передаёт промежуточную строку.

  @example
  ```ts
  const input: ImmersiveNodesParameterPath.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "./scene.glb",
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: PathFieldProps["value"]
    readonly placeholder?: PathFieldProps["placeholder"]
    readonly density?: PathFieldProps["density"]
    readonly browseTitle?: PathFieldProps["browseTitle"]
    readonly onInput?: PathFieldProps["onInput"]
    readonly onChange?: PathFieldProps["onChange"]
    readonly onBrowse?: PathFieldProps["onBrowse"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
