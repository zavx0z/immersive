/**
Планирует размеры ноды и центры сокетов по высотам строк.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodePlan as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodePlan} from "./contract"

import metrics from "@zavx0z/immersive-nodes-geometry-node-metrics"
const {NODE_MINIMUM_WIDTH, NODE_HEADER_HEIGHT, NODE_BODY_PADDING_TOP, NODE_BODY_PADDING_BOTTOM, NODE_ROW_GAP, NODE_COLLAPSED_HEIGHT} = metrics
import socketMetrics from "@zavx0z/immersive-nodes-model-socket-metrics"
const {NODE_BORDER_WIDTH, NODE_ROW_HEIGHT, SOCKET_GLYPH_SIZE} = socketMetrics
import type {Row} from "./contract/types"

export default function planNodeGeometry(input: Contract.Input): Contract.Output {
  const requestedWidth = input.width ?? NODE_MINIMUM_WIDTH
  positiveFinite(requestedWidth, "Node requested width")
  const width = Math.max(NODE_MINIMUM_WIDTH, requestedWidth)
  const contentHeight = input.contentVisible === true ? width : 0
  if (input.collapsed === true) {
    const socketRows = input.rows.filter(row => (row.socketIds?.length ?? 0) > 0)
    const headerHeight = Math.max(NODE_HEADER_HEIGHT, socketRows.length * SOCKET_GLYPH_SIZE)
    const seen = new Set<string>()
    const sockets = socketRows.flatMap((row, index) => (row.socketIds ?? []).map(id => {
      if (seen.has(id)) throw new Error(`Node geometry Socket id must be unique: ${id}`)
      seen.add(id)
      return Object.freeze({id, y: contentHeight + NODE_BORDER_WIDTH + headerHeight * (index + .5) / socketRows.length})
    }))
    const height = contentHeight + NODE_BORDER_WIDTH * 2 + headerHeight
    return Object.freeze({width, height, contentHeight: height, rows: Object.freeze([]), sockets: Object.freeze(sockets)})
  }
  const socketIds = new Set<string>()
  let cursor = contentHeight + NODE_BORDER_WIDTH + NODE_HEADER_HEIGHT + NODE_BODY_PADDING_TOP
  const rows = input.rows.map((inputRow, index): Row => {
    const height = inputRow.height ?? NODE_ROW_HEIGHT
    const spacingBefore = inputRow.spacingBefore ?? 0
    positiveFinite(height, `Node row ${index} height`)
    nonNegativeFinite(spacingBefore, `Node row ${index} spacingBefore`)
    if (index > 0) cursor += NODE_ROW_GAP
    cursor += spacingBefore
    const top = cursor
    const rowSocketIds = Object.freeze([...(inputRow.socketIds ?? [])])
    for (const socketId of rowSocketIds) {
      if (socketId.trim().length === 0) throw new TypeError(`Node row ${index} Socket id must be non-empty`)
      if (socketIds.has(socketId)) throw new Error(`Node geometry Socket id must be unique: ${socketId}`)
      socketIds.add(socketId)
    }
    cursor += height
    return Object.freeze({
      index,
      top,
      height,
      centerY: top + height / 2,
      socketIds: rowSocketIds,
    })
  })
  const height = cursor + NODE_BODY_PADDING_BOTTOM + NODE_BORDER_WIDTH
  const sockets = Object.freeze(rows.flatMap(row => row.socketIds.map(id => Object.freeze({
    id,
    y: row.centerY,
  }))))
  return Object.freeze({
    width,
    height,
    contentHeight: height,
    rows: Object.freeze(rows),
    sockets,
  })
}

function positiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${label} must be a positive finite number`)
  return value
}

function nonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a non-negative finite number`)
  return value
}
