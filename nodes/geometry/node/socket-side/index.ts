/**
Сохраняет принятую сторону Layout либо сторону модели сокета.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodeSocketSide as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodeSocketSide} from "./contract"

import socketKey from "@immersive-nodes-model-socket/key"
import socketSide from "@immersive-nodes-model-socket/side"

export default function projectedSocketSide(
  nodeId: Contract.Input[0],
  socket: Contract.Input[1],
  resolvedSocketSides?: Contract.Input[2],
): Contract.Output {
  return resolvedSocketSides?.get(socketKey(nodeId, socket.id)) ?? socketSide(socket)
}
