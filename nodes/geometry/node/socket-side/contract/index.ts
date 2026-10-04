import type {Socket as CoreSocket} from "@zavx0z/immersive-nodes-tree"
import type {ImmersiveNodesModelSocketSide} from "@zavx0z/immersive-nodes-model-socket-side"

/** Сохраняет принятую сторону Layout либо сторону модели сокета. */
export declare namespace ImmersiveNodesGeometryNodeSocketSide {
  type Input = readonly [nodeId: string, socket: CoreSocket, resolvedSocketSides?: ReadonlyMap<string, ImmersiveNodesModelSocketSide.Output>]
  type Output = ImmersiveNodesModelSocketSide.Output
}
