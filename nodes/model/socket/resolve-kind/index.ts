/**
Сохраняет известный вид сокета, заменяя неизвестный на custom.

@packageDocumentation
*/
import type {SocketValuesResolveKind as Contract} from "./contract"
export type {SocketValuesResolveKind} from "./contract"

import SOCKET_KINDS from "@socket-values/kinds"

type SocketKind = Contract.Output

export default function resolveSocketKind(value: Contract.Input): Contract.Output {
  return SOCKET_KINDS.includes(value as SocketKind) ? value as SocketKind : "custom"
}
