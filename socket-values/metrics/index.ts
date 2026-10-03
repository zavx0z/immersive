/**
Общие размеры сокета и строки в логических CSS-пикселях.

@packageDocumentation
*/
import type {SocketValuesMetrics as Contract} from "./contract"
export type {SocketValuesMetrics} from "./contract"

const metrics: Contract.Output = Object.freeze({
  NODE_BORDER_WIDTH: 1,
  NODE_ROW_HEIGHT: 22,
  SOCKET_GLYPH_SIZE: 12,
})

export default metrics
