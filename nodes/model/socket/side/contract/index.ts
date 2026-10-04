import type {Socket as CoreSocket} from "@zavx0z/immersive-nodes-tree"

/** Определяет сторону сокета по явному значению и направлению. */
export declare namespace Zavx0zImmersiveNodesModelSocketSide {
  type Input = Pick<CoreSocket, "direction" | "side">
  type Output = NonNullable<CoreSocket["side"]>
}
