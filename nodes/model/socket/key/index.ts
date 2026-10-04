/**
Составляет однозначный адрес сокета из идентификаторов ноды и сокета.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketKey as Contract} from "./contract"
export type {ImmersiveNodesModelSocketKey} from "./contract"

export default function socketKey(nodeId: Contract.Input[0], socketId: Contract.Input[1]): Contract.Output {
  return JSON.stringify([nodeId, socketId])
}
