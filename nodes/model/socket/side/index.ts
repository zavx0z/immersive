/**
Определяет сторону сокета по явному значению и направлению.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesModelSocketSide as Contract} from "./contract"
export type {Zavx0zImmersiveNodesModelSocketSide} from "./contract"

export default function socketSide(socket: Contract.Input): Contract.Output {
  return socket.side ?? (socket.direction === "output" ? "right" : "left")
}
