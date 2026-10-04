import type {ImmersiveUiComponentFieldVector} from "@zavx0z/immersive-ui-component-field-vector"
type VectorFieldProps = ImmersiveUiComponentFieldVector.Input
import type {ImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный тип значения и общие гарантии авторского параметра. */
export declare namespace ImmersiveNodesParameterCompositeVector {
  /**
  Входные данные векторного параметра, связанного с нодой и её сокетами.

  Компоненты вектора и их подписи передаются публичному `VectorField` без локального состояния.

  @property id - Идентификатор параметра внутри ноды.

  @property nodeId - Адрес ноды параметра.
  Автор задаёт тот же адрес у Socket, назначенных слотам строки.

  @remarks Socket передаются JSX-содержимым в именованные слоты `left` и `right`.

  @property [connected=false] - Состояние подключения; поле и его обработчики остаются доступными.

  @property value - От двух до четырёх числовых компонент.

  @property [axes] - Подписи осей в порядке компонент.

  @property [onInput] - Передаёт промежуточный вектор целиком.

  @example
  ```ts
  const input: ImmersiveNodesParameterCompositeVector.Input = {
    id: "value",
    nodeId: "node",
    label: "Значение",
    value: [0, 0, 0],
  }
  ```
  */
  interface Input extends ImmersiveNodesParameter.Input {
    readonly value: VectorFieldProps["value"]
    readonly axes?: VectorFieldProps["axes"]
    readonly min?: VectorFieldProps["min"]
    readonly max?: VectorFieldProps["max"]
    readonly step?: VectorFieldProps["step"]
    readonly density?: VectorFieldProps["density"]
    readonly onInput?: VectorFieldProps["onInput"]
    readonly onChange?: VectorFieldProps["onChange"]
  }

  type Slots = ImmersiveNodesParameter.Slots

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
