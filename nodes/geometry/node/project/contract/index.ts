import type {NodeJsonValue, NodeTreeNodeSnapshot, ParameterReference} from "@zavx0z/immersive-nodes-tree"
import type {Zavx0zImmersiveNodesGeometryNodePlan} from "@zavx0z/immersive-nodes-geometry-node-plan"

/** Планирует геометрию снимка ноды по представлениям параметров. */
export declare namespace Zavx0zImmersiveNodesGeometryNodeProject {
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
  type Output = Zavx0zImmersiveNodesGeometryNodePlan.Output
}
