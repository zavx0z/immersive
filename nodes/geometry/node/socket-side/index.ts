/**
Сохраняет принятую сторону Layout либо сторону модели сокета.

@packageDocumentation
*/
import type {NodeGeometrySocketSide as Contract} from "./contract"
export type {NodeGeometrySocketSide} from "./contract"

import socketKey from "@socket-values/key"
import socketSide from "@socket-values/side"

export default function projectedSocketSide(
  nodeId: Contract.Input[0],
  socket: Contract.Input[1],
  resolvedSocketSides?: Contract.Input[2],
): Contract.Output {
  return resolvedSocketSides?.get(socketKey(nodeId, socket.id)) ?? socketSide(socket)
}
