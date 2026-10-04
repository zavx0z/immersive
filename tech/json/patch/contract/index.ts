import type {ImmersiveTechJsonValueOwn} from "@immersive-tech-json-value/own"
import type {Operation} from "./types"

/** Атомарное применение ограниченного набора JSON Patch без изменения исходного документа. */
export declare namespace ImmersiveTechJsonPatch {
  type Input = readonly [source: ImmersiveTechJsonValueOwn.Input[0], operations: readonly Operation[]]
  type Output = ImmersiveTechJsonValueOwn.Output
}
