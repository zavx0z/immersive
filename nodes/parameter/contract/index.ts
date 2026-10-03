import type {JSX} from "@jsx-compiler/session"
import type {ParameterEndpoint} from "./types"

/** Авторские параметры разделяют адрес ноды, подпись, сокеты и внешнее состояние. */
export declare namespace NodesParameters {
  /** Общая строка параметра; конкретное значение и его события определяет участник. */
  interface Input {
    readonly id: string
    readonly nodeId: string
    readonly label: string
    readonly labelHidden?: boolean | undefined
    readonly spacingBefore?: "small" | "medium" | undefined
    readonly sockets?: readonly ParameterEndpoint[] | undefined
    readonly connected?: boolean | undefined
    readonly hidden?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
    readonly onSocketActivate?: ((socketId: string, event: Event) => void) | undefined
  }

  type Output = JSX.Element<object>
}
