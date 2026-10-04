/**
Создаёт адрес порта Layout из непустых идентификаторов ноды и сокета.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodePortId as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodePortId} from "./contract"

import socketKey from "@zavx0z/immersive-nodes-model-socket-key"

export default function nodeSocketLayoutPortId(nodeId: Contract.Input[0], socketId: Contract.Input[1]): Contract.Output {
  if (nodeId.length === 0 || socketId.length === 0) throw new TypeError("Socket endpoint IDs must be non-empty")
  return socketKey(nodeId, socketId)
}
