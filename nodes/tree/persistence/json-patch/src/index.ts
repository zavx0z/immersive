/** Переходный вход модели сохраняет происхождение самостоятельных JSON-возможностей. @packageDocumentation */
export {default as applyJsonPatch} from "@immersive-tech-json/patch"
export {default as encodeJsonPointerToken} from "@immersive-tech-json-pointer/token"
export {default as JsonPatchError} from "@immersive-tech-json-patch/error"
export {default as JSON_PATCH_LIMITS} from "@immersive-tech-json-patch/limits"
import type {ImmersiveTechJsonPatch} from "@immersive-tech-json/patch"
import type {ImmersiveTechJsonPatchError} from "@immersive-tech-json-patch/error"
export type JsonPatchOperation = ImmersiveTechJsonPatch.Input[1][number]
export type JsonPatchErrorCode = ImmersiveTechJsonPatchError.Input[0]
