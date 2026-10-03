import type {NodeJsonValue, NodeTreeNodeSnapshot, ParameterReference} from "@nodes/tree"
import type {NodeGeometryPlan} from "@node-geometry/plan"

/** Планирует геометрию снимка ноды по представлениям параметров. */
export declare namespace NodeGeometryProject {
  type Input = readonly [
    snapshot: NodeTreeNodeSnapshot<ParameterReference, NodeJsonValue, NodeJsonValue>,
    width?: number,
    connectedSocketKeys?: ReadonlySet<string>,
    resolvedSocketSides?: ReadonlyMap<string, "left" | "right">,
    presentation?: Readonly<{
      kind?: "parameter" | "content" | "diagram" | undefined
      collapsed?: boolean | undefined
      contentVisible?: boolean | undefined
      shape?: "rectangle" | "oval" | "circle" | undefined
      height?: number | undefined
    }>
  ]
  type Output = NodeGeometryPlan.Output
}
