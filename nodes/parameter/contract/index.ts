import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type Socket from "@zavx0z/immersive-nodes-socket"

/** Авторские параметры разделяют адрес ноды, подпись, сокеты и внешнее состояние. */
export declare namespace ImmersiveNodesParameter {
  /** Общая строка параметра; конкретное значение и его события определяет участник. */
  interface Input {
    readonly id: string
    readonly nodeId: string
    readonly label: string
    readonly labelHidden?: boolean | undefined
    readonly spacingBefore?: "small" | "medium" | undefined
    /** Состояние подключения не переключает видимость или доступность поля. */
    readonly connected?: boolean | undefined
    readonly hidden?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Автор назначает готовые Socket каждой стороне; пустой слот не создаёт сокет. */
  interface Slots {
    readonly left?: readonly typeof Socket[]
    readonly right?: readonly typeof Socket[]
  }

  type Output = JSX.Element<Slots>
}
