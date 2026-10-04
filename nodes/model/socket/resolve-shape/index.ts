/**
Сохраняет известную форму сокета, оставляя неизвестную неопределённой.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketResolveShape as Contract} from "./contract"
export type {ImmersiveNodesModelSocketResolveShape} from "./contract"

import SOCKET_SHAPES from "@immersive-nodes-model-socket/shapes"

type SocketShape = NonNullable<Contract.Output>

export default function resolveSocketShape(value: Contract.Input): Contract.Output {
  return SOCKET_SHAPES.includes(value as SocketShape) ? value as SocketShape : undefined
}
