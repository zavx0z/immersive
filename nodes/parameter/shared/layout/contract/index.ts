import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Пользовательское поле с собственной подписью в общей строке с сокетами. */
export declare namespace ImmersiveNodesParameterSharedLayout {
  interface Input extends ImmersiveNodesParameter.Input {
    readonly kind: string
  }

  interface Slots extends ImmersiveNodesParameter.Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveNodesParameter.Output & JSX.Element<Slots>
}
