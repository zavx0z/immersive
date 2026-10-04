/**
Сохраняет принятую сторону Layout либо сторону модели сокета.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesGeometryNodeSocketSide as Contract} from "./contract"
export type {Zavx0zImmersiveNodesGeometryNodeSocketSide} from "./contract"

import socketKey from "@zavx0z/immersive-nodes-model-socket-key"
import socketSide from "@zavx0z/immersive-nodes-model-socket-side"

export default function projectedSocketSide(
  nodeId: Contract.Input[0],
  socket: Contract.Input[1],
  resolvedSocketSides?: Contract.Input[2],
): Contract.Output {
  return resolvedSocketSides?.get(socketKey(nodeId, socket.id)) ?? socketSide(socket)
}
