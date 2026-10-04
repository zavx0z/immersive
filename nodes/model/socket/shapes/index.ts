/**
Перечень поддерживаемых форм сокета.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesModelSocketShapes as Contract} from "./contract"
export type {Zavx0zImmersiveNodesModelSocketShapes} from "./contract"

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
