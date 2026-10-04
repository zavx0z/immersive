/**
Выбирает предустановку известного вида сокета.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesModelSocketPreset as Contract} from "./contract"
export type {Zavx0zImmersiveNodesModelSocketPreset} from "./contract"

import SOCKET_KINDS from "@zavx0z/immersive-nodes-model-socket-kinds"
import SOCKET_PRESETS from "@zavx0z/immersive-nodes-model-socket-presets"

export default function socketPreset(kind: Contract.Input): Contract.Output {
  if (!SOCKET_KINDS.includes(kind)) throw new TypeError(`Unsupported Socket kind: ${kind}`)
  return SOCKET_PRESETS[kind]
}
