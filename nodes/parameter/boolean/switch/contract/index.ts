import type {Zavx0zImmersiveUiComponentFieldSwitch} from "@zavx0z/immersive-ui-component-field-switch"
type SwitchFieldProps = Zavx0zImmersiveUiComponentFieldSwitch.Input
import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace Zavx0zImmersiveNodesParameterBooleanSwitch {
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
  const input: Zavx0zImmersiveNodesParameterBooleanSwitch.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    checked: true,
  }
  ```
  */
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly checked: SwitchFieldProps["checked"]
    readonly onChange?: SwitchFieldProps["onChange"]
  }

  type Slots = Zavx0zImmersiveNodesParameter.Slots

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
