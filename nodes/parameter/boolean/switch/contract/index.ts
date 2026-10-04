import type {ImmersiveUiComponentFieldSwitch} from "@zavx0z/immersive-ui-component-field-switch"
type SwitchFieldProps = ImmersiveUiComponentFieldSwitch.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterBooleanSwitch {
  /**
  Входные данные логического параметра-переключателя, связанного с нодой и её сокетами.

  Текущее значение остаётся у вызывающей стороны; компонент только возвращает запрос переключения.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property checked - Текущее логическое значение.

  @property [onChange] - Передаёт предложенное значение без записи во внешний Store.

  @example
  ```ts
  const input: ImmersiveNodesParameterBooleanSwitch.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    checked: true,
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly checked: SwitchFieldProps["checked"]
    readonly onChange?: SwitchFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
