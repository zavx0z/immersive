import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Operation} from "./types"

/** Атомарное применение ограниченного набора JSON Patch без изменения исходного документа. */
export declare namespace Zavx0zImmersiveTechJsonPatch {
  type Input = readonly [source: Zavx0zImmersiveTechJsonValueOwn.Input[0], operations: readonly Operation[]]
  type Output = Zavx0zImmersiveTechJsonValueOwn.Output
}
