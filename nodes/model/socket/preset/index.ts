/**
Выбирает предустановку известного вида сокета.

@packageDocumentation
*/
import type {SocketValuesPreset as Contract} from "./contract"
export type {SocketValuesPreset} from "./contract"

import SOCKET_KINDS from "@socket-values/kinds"
import SOCKET_PRESETS from "@socket-values/presets"

export default function socketPreset(kind: Contract.Input): Contract.Output {
  if (!SOCKET_KINDS.includes(kind)) throw new TypeError(`Unsupported Socket kind: ${kind}`)
  return SOCKET_PRESETS[kind]
}
