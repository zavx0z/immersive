import type {Socket as CoreSocket} from "@zavx0z/immersive-nodes-tree"
import type {Zavx0zImmersiveNodesModelSocketSide} from "@zavx0z/immersive-nodes-model-socket-side"

/** Сохраняет принятую сторону Layout либо сторону модели сокета. */
export declare namespace Zavx0zImmersiveNodesGeometryNodeSocketSide {
  type Input = readonly [nodeId: string, socket: CoreSocket, resolvedSocketSides?: ReadonlyMap<string, Zavx0zImmersiveNodesModelSocketSide.Output>]
  type Output = Zavx0zImmersiveNodesModelSocketSide.Output
}
