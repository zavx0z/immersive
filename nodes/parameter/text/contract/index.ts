import type {ImmersiveUiComponentFieldText} from "@immersive-ui-component-field/text"
type TextFieldProps = ImmersiveUiComponentFieldText.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterText {
  /**
  Входные данные строкового параметра, связанного с нодой и её сокетами.

  Поле сохраняет строку во внешнем состоянии; подключение сокета не скрывает редактор и не блокирует ручной ввод.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Текущее строковое значение.

  @property [type] - Режим ввода публичного `TextField`.

  @property [onInput] - Публикует промежуточное строковое значение.

  @example
  ```ts
  const input: ImmersiveNodesParameterText.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: "текст",
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: TextFieldProps["value"]
    readonly type?: TextFieldProps["type"]
    readonly placeholder?: TextFieldProps["placeholder"]
    readonly onInput?: TextFieldProps["onInput"]
    readonly onChange?: TextFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
