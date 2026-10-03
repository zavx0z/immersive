import type {UiFieldsVectorField} from "@ui-fields/vector-field"
type VectorFieldProps = UiFieldsVectorField.Input
import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace NodesParametersVector {
  /**
  Входные данные векторного параметра, связанного с нодой и её сокетами.

  Компоненты вектора и их подписи передаются публичному `VectorField` без локального состояния.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Идентификатор ноды для адресов всех сокетов строки.

  @property [sockets] - Адресуемые сокеты параметра с уже выбранными сторонами.

  @property [connected=false] - Скрывает поле, сохраняя строку, подпись и сокеты.

  @property [onSocketActivate] - Получает исходный идентификатор сокета.

  @property value - От двух до четырёх числовых компонент.

  @property [axes] - Подписи осей в порядке компонент.

  @property [onInput] - Передаёт промежуточный вектор целиком.

  @example
  ```ts
  const input: NodesParametersVector.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: [0, 0, 0],
  }
  ```
  */
  interface Input extends NodesParameters.Input {
    readonly value: VectorFieldProps["value"]
    readonly axes?: VectorFieldProps["axes"]
    readonly min?: VectorFieldProps["min"]
    readonly max?: VectorFieldProps["max"]
    readonly step?: VectorFieldProps["step"]
    readonly density?: VectorFieldProps["density"]
    readonly onInput?: VectorFieldProps["onInput"]
    readonly onChange?: VectorFieldProps["onChange"]
  }

  type Output = NodesParameters.Output & JSX.Element
}
