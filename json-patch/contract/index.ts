import type {NodeValuesOwn} from "@node-values/own"
import type {JsonPatchOperation} from "./types"

/** Атомарное применение ограниченного набора JSON Patch без изменения исходного документа. */
export declare namespace NodesJsonPatch {
  type Input = readonly [source: NodeValuesOwn.Input[0], operations: readonly JsonPatchOperation[]]
  type Output = NodeValuesOwn.Output
}
