/**
Создаёт адрес порта Layout из непустых идентификаторов ноды и сокета.

@packageDocumentation
*/
import type {NodeGeometryPortId as Contract} from "./contract"
export type {NodeGeometryPortId} from "./contract"

import socketKey from "@socket-values/key"

export default function nodeSocketLayoutPortId(nodeId: Contract.Input[0], socketId: Contract.Input[1]): Contract.Output {
  if (nodeId.length === 0 || socketId.length === 0) throw new TypeError("Socket endpoint IDs must be non-empty")
  return socketKey(nodeId, socketId)
}
