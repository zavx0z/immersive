import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Пользовательское поле с собственной подписью в общей строке с сокетами. */
export declare namespace NodesParametersLayout {
  interface Input extends NodesParameters.Input {
    readonly kind: string
  }

  interface Slots extends NodesParameters.Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
