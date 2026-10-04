/**
Определяет сторону сокета по явному значению и направлению.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketSide as Contract} from "./contract"
export type {ImmersiveNodesModelSocketSide} from "./contract"

export default function socketSide(socket: Contract.Input): Contract.Output {
  return socket.side ?? (socket.direction === "output" ? "right" : "left")
}
