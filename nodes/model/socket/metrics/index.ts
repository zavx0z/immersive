/**
Общие размеры сокета и строки в логических CSS-пикселях.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketMetrics as Contract} from "./contract"
export type {ImmersiveNodesModelSocketMetrics} from "./contract"

const metrics: Contract.Output = Object.freeze({
  NODE_BORDER_WIDTH: 1,
  NODE_ROW_HEIGHT: 22,
  SOCKET_GLYPH_SIZE: 12,
})

export default metrics
