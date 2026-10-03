/**
Сохраняет известную форму сокета, оставляя неизвестную неопределённой.

@packageDocumentation
*/
import type {SocketValuesResolveShape as Contract} from "./contract"
export type {SocketValuesResolveShape} from "./contract"

import SOCKET_SHAPES from "@socket-values/shapes"

type SocketShape = NonNullable<Contract.Output>

export default function resolveSocketShape(value: Contract.Input): Contract.Output {
  return SOCKET_SHAPES.includes(value as SocketShape) ? value as SocketShape : undefined
}
