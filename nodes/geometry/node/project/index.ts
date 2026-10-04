/**
Планирует геометрию снимка ноды по представлениям параметров.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodeProject as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodeProject} from "./contract"

import type {Socket as CoreSocket} from "@zavx0z/immersive-nodes-tree"
import type {ImmersiveNodesGeometryNodePlan} from "@zavx0z/immersive-nodes-geometry-node-plan"
type NodeGeometryRowInput = ImmersiveNodesGeometryNodePlan.Input["rows"][number]
type ProjectedNodeSnapshot = Contract.Input[0]
import resolveProjectedParameterPresentation from "@zavx0z/immersive-nodes-projection-parameter-presentation"
import parameterMetrics from "@zavx0z/immersive-nodes-geometry-parameter"
const {NODE_PARAMETER_SPACING_SMALL, NODE_PARAMETER_SPACING_MEDIUM} = parameterMetrics
import projectedParameterFieldHeight from "@zavx0z/immersive-nodes-geometry-node-field-height"
import parameterSpacingBefore from "@zavx0z/immersive-nodes-geometry-node-spacing"
import projectedSocketSide from "@zavx0z/immersive-nodes-geometry-node-socket-side"
import nodeSocketLayoutPortId from "@zavx0z/immersive-nodes-geometry-node-port-id"
import planNodeGeometry from "@zavx0z/immersive-nodes-geometry-node-plan"
import nodeMetrics from "@zavx0z/immersive-nodes-geometry-node-metrics"
const {NODE_MINIMUM_WIDTH} = nodeMetrics
import socketMetrics from "@zavx0z/immersive-nodes-model-socket-metrics"
const {NODE_ROW_HEIGHT} = socketMetrics

export default function planProjectedNodeGeometry(
  snapshot: Contract.Input[0],
  width?: Contract.Input[1],
  _connectedSocketKeys?: Contract.Input[2],
  resolvedSocketSides?: Contract.Input[3],
  presentation: NonNullable<Contract.Input[4]> = {},
): Contract.Output {
  const parameterIds = new Set(snapshot.parameters.map(parameter => parameter.id))
  const socketsByParameter = new Map<string, CoreSocket[]>()
  const loose: CoreSocket[] = []
  for (const socket of snapshot.sockets) {
    if (socket.parameterId === undefined || !parameterIds.has(socket.parameterId)) {
      loose.push(socket)
      continue
    }
    const sockets = socketsByParameter.get(socket.parameterId) ?? []
    sockets.push(socket)
    socketsByParameter.set(socket.parameterId, sockets)
  }
  const right = loose.filter(socket => projectedSocketSide(
    snapshot.id,
    socket,
    resolvedSocketSides,
  ) === "right")
  const left = loose.filter(socket => projectedSocketSide(
    snapshot.id,
    socket,
    resolvedSocketSides,
  ) === "left")
  const rows: NodeGeometryRowInput[] = [
    ...right.map(socket => projectedSocketRow(snapshot.id, socket)),
    ...snapshot.parameters.map(parameter => {
      const sockets = socketsByParameter.get(parameter.id) ?? []
      const resolved = resolveProjectedParameterPresentation(parameter)
      return Object.freeze({
        height: Math.max(NODE_ROW_HEIGHT, projectedParameterFieldHeight(resolved)),
        spacingBefore: parameterSpacingBeforePixels(parameter),
        socketIds: Object.freeze(sockets.map(socket =>
          nodeSocketLayoutPortId(snapshot.id, socket.id))),
      })
    }),
    ...left.map(socket => projectedSocketRow(snapshot.id, socket)),
  ]
  if (presentation.kind === "diagram") {
    const diagramWidth = Math.max(NODE_MINIMUM_WIDTH, width ?? NODE_MINIMUM_WIDTH)
    const height = presentation.shape === "circle" ? diagramWidth : presentation.height ?? 60
    if (!Number.isFinite(height) || height <= 0) throw new TypeError("Diagram Node height must be positive and finite")
    return Object.freeze({width: diagramWidth, height, contentHeight: height, rows: Object.freeze([]),
      sockets: Object.freeze(snapshot.sockets.map(socket => Object.freeze({id: nodeSocketLayoutPortId(snapshot.id, socket.id), y: height / 2})))})
  }
  return planNodeGeometry({width, rows: Object.freeze(rows), collapsed: presentation.collapsed, contentVisible: presentation.contentVisible})
}



function parameterSpacingBeforePixels(
  parameter: ProjectedNodeSnapshot["parameters"][number],
): number {
  const spacing = parameterSpacingBefore(parameter)
  if (spacing === "small") return NODE_PARAMETER_SPACING_SMALL
  if (spacing === "medium") return NODE_PARAMETER_SPACING_MEDIUM
  return 0
}


function projectedSocketRow(nodeId: string, socket: CoreSocket): NodeGeometryRowInput {
  return Object.freeze({
    height: NODE_ROW_HEIGHT,
    socketIds: Object.freeze([nodeSocketLayoutPortId(nodeId, socket.id)]),
  })
}
