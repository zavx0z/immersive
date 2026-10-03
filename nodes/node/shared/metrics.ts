/** Числовой план и его размеры имеют отдельных публичных владельцев. @packageDocumentation */
export {default as planNodeGeometry} from "@node-geometry/plan"
import type {NodeGeometryPlan as Plan} from "@node-geometry/plan"
export type NodeGeometryRowInput = Plan.Input["rows"][number]
export type NodeGeometryRow = Plan.Output["rows"][number]
export type NodeGeometryPlan = Plan.Output
import metrics from "@node-geometry/metrics"
export const {NODE_MINIMUM_WIDTH, NODE_HEADER_HEIGHT, NODE_BODY_PADDING_TOP, NODE_BODY_PADDING_BOTTOM, NODE_ROW_GAP, NODE_COLLAPSED_HEIGHT} = metrics
