import type {NodesParameters} from "@nodes/parameters/contract"
import type {JSX} from "@jsx-compiler/session"

/** Пользовательское поле в общей строке параметра с подписью и сокетами. */
export declare namespace NodesParametersLayout {
  interface Input extends NodesParameters.Input {
    readonly kind: string
    readonly fieldOwnsLabel?: boolean | undefined
    readonly fieldBeforeLabel?: boolean | undefined
  }

  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = NodesParameters.Output & JSX.Element<Slots>
}
