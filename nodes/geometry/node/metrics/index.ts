/**
Размеры ноды и строки без чтения DOM.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodeMetrics as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodeMetrics} from "./contract"

import socketMetrics from "@immersive-nodes-model-socket/metrics"
const {NODE_BORDER_WIDTH, NODE_ROW_HEIGHT, SOCKET_GLYPH_SIZE} = socketMetrics

const NODE_MINIMUM_WIDTH = 100
const NODE_HEADER_HEIGHT = 22
const NODE_BODY_PADDING_TOP = 8
const NODE_BODY_PADDING_BOTTOM = 6
const NODE_ROW_GAP = 3

const NODE_COLLAPSED_HEIGHT = NODE_BORDER_WIDTH * 2 + NODE_HEADER_HEIGHT


const metrics: Contract.Output = Object.freeze({NODE_MINIMUM_WIDTH, NODE_HEADER_HEIGHT, NODE_BODY_PADDING_TOP, NODE_BODY_PADDING_BOTTOM, NODE_ROW_GAP, NODE_COLLAPSED_HEIGHT})
export default metrics
