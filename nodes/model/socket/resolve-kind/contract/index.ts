import type {ImmersiveNodesModelSocketKinds} from "@immersive-nodes-model-socket/kinds"

/** Сохраняет известный вид сокета, заменяя неизвестный на custom. */
export declare namespace ImmersiveNodesModelSocketResolveKind {
  type Input = string
  type Output = ImmersiveNodesModelSocketKinds.Output[number]
}
