import type {ImmersiveUiComponentFieldMatrix} from "@immersive-ui-component-field/matrix"
type MatrixFieldProps = ImmersiveUiComponentFieldMatrix.Input
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterCompositeMatrix {
  /**
  Входные данные матричного параметра, связанного с нодой и её сокетами.

  Квадратная матрица редактируется как одно внешнее значение без собственной копии в компоненте.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - Квадратная матрица размером 2, 3 или 4.

  @property [step] - Шаг изменения числовых ячеек.

  @property [onChange] - Передаёт подтверждённую матрицу целиком.

  @example
  ```ts
  const input: ImmersiveNodesParameterCompositeMatrix.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: [[1, 0], [0, 1]],
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: MatrixFieldProps["value"]
    readonly step?: MatrixFieldProps["step"]
    readonly density?: MatrixFieldProps["density"]
    readonly onInput?: MatrixFieldProps["onInput"]
    readonly onChange?: MatrixFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
