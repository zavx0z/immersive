/**
Сохраняет известный вид сокета, заменяя неизвестный на custom.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketResolveKind as Contract} from "./contract"
export type {ImmersiveNodesModelSocketResolveKind} from "./contract"

import SOCKET_KINDS from "@zavx0z/immersive-nodes-model-socket-kinds"

type SocketKind = Contract.Output

export default function resolveSocketKind(value: Contract.Input): Contract.Output {
  return SOCKET_KINDS.includes(value as SocketKind) ? value as SocketKind : "custom"
}
