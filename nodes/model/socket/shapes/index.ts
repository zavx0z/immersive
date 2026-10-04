/**
Перечень поддерживаемых форм сокета.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketShapes as Contract} from "./contract"
export type {ImmersiveNodesModelSocketShapes} from "./contract"

const SOCKET_SHAPES: Contract.Output = Object.freeze([
  "circle",
  "square",
  "diamond",
  "circle-dot",
  "square-dot",
  "diamond-dot",
  "line",
  "volume-grid",
] as const)

export default SOCKET_SHAPES
