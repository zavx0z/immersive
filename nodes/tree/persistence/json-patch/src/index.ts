/** Переходный вход модели сохраняет происхождение самостоятельных JSON-возможностей. @packageDocumentation */
export {default as applyJsonPatch} from "@zavx0z/immersive-tech-json-patch"
export {default as encodeJsonPointerToken} from "@zavx0z/immersive-tech-json-pointer-token"
export {default as JsonPatchError} from "@zavx0z/immersive-tech-json-patch-error"
export {default as JSON_PATCH_LIMITS} from "@zavx0z/immersive-tech-json-patch-limits"
import type {ImmersiveTechJsonPatch} from "@zavx0z/immersive-tech-json-patch"
import type {ImmersiveTechJsonPatchError} from "@zavx0z/immersive-tech-json-patch-error"
export type JsonPatchOperation = ImmersiveTechJsonPatch.Input[1][number]
export type JsonPatchErrorCode = ImmersiveTechJsonPatchError.Input[0]
