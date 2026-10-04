/**
Задаёт допустимые размеры операций JSON Patch.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonPatchLimits as Contract} from "./contract"
export type {Zavx0zImmersiveTechJsonPatchLimits} from "./contract"

const JSON_PATCH_LIMITS: Contract.Output = Object.freeze({
  operations: 256,
  pathLength: 4_096,
  depth: 128,
})

export default JSON_PATCH_LIMITS
