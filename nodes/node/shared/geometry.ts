/** Числовые возможности ноды происходят из самостоятельных владельцев. @packageDocumentation */
export {default as planProjectedNodeGeometry} from "@node-geometry/project"
export {default as nodeSocketLayoutPortId} from "@node-geometry/port-id"
export {default as planNodeGeometry} from "@node-geometry/plan"
export type {NodeRect} from "./contracts"
import type {NodeGeometryProject} from "@node-geometry/project"
import type {NodeGeometryPlan as Plan} from "@node-geometry/plan"
export type ProjectedNodeSnapshot = NodeGeometryProject.Input[0]
export type NodeGeometryPresentation = NonNullable<NodeGeometryProject.Input[4]>
export type NodeGeometryPlan = Plan.Output
export type NodeGeometryRowInput = Plan.Input["rows"][number]
export type NodeGeometryRow = Plan.Output["rows"][number]
import metrics from "@node-geometry/metrics"
export const {NODE_MINIMUM_WIDTH, NODE_HEADER_HEIGHT, NODE_BODY_PADDING_TOP, NODE_BODY_PADDING_BOTTOM, NODE_ROW_GAP, NODE_COLLAPSED_HEIGHT} = metrics
