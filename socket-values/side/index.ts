/**
Определяет сторону сокета по явному значению и направлению.

@packageDocumentation
*/
import type {SocketValuesSide as Contract} from "./contract"
export type {SocketValuesSide} from "./contract"

export default function socketSide(socket: Contract.Input): Contract.Output {
  return socket.side ?? (socket.direction === "output" ? "right" : "left")
}
