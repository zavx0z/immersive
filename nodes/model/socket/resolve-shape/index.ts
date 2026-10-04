/**
Сохраняет известную форму сокета, оставляя неизвестную неопределённой.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesModelSocketResolveShape as Contract} from "./contract"
export type {Zavx0zImmersiveNodesModelSocketResolveShape} from "./contract"

import SOCKET_SHAPES from "@zavx0z/immersive-nodes-model-socket-shapes"

type SocketShape = NonNullable<Contract.Output>

export default function resolveSocketShape(value: Contract.Input): Contract.Output {
  return SOCKET_SHAPES.includes(value as SocketShape) ? value as SocketShape : undefined
}
