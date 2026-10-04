import type {Zavx0zImmersiveNodesParameter} from "@zavx0z/immersive-nodes-parameter/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Пользовательское поле с собственной подписью в общей строке с сокетами. */
export declare namespace Zavx0zImmersiveNodesParameterSharedLayout {
  interface Input extends Zavx0zImmersiveNodesParameter.Input {
    readonly kind: string
  }

  interface Slots extends Zavx0zImmersiveNodesParameter.Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = Zavx0zImmersiveNodesParameter.Output & JSX.Element<Slots>
}
