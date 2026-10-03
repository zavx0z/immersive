import type {UiFieldsMatrixField} from "@ui-fields/matrix-field"
type MatrixFieldProps = UiFieldsMatrixField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersMatrix {
  /**
  Входные данные матричного параметра, связанного с нодой и её сокетами.

  Квадратная матрица редактируется как одно внешнее значение без собственной копии в компоненте.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property value - Квадратная матрица размером 2, 3 или 4.

  @property [step] - Шаг изменения числовых ячеек.

  @property [onChange] - Передаёт подтверждённую матрицу целиком.

  @example
  ```ts
  const input: NodesParametersMatrix.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: [[1, 0], [0, 1]],
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: MatrixFieldProps["value"]
    readonly step?: MatrixFieldProps["step"]
    readonly density?: MatrixFieldProps["density"]
    readonly onInput?: MatrixFieldProps["onInput"]
    readonly onChange?: MatrixFieldProps["onChange"]
  }

  type Slots = NodesParameters.Slots

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
