/** Переходный вход модели сохраняет происхождение самостоятельных JSON-возможностей. @packageDocumentation */
export {default as applyJsonPatch} from "@nodes/json-patch"
export {default as encodeJsonPointerToken} from "@nodes/json-pointer-token"
export {default as JsonPatchError} from "@node-json-patch/error"
export {default as JSON_PATCH_LIMITS} from "@node-json-patch/limits"
import type {NodesJsonPatch} from "@nodes/json-patch"
import type {NodeJsonPatchError} from "@node-json-patch/error"
export type JsonPatchOperation = NodesJsonPatch.Input[1][number]
export type JsonPatchErrorCode = NodeJsonPatchError.Input[0]
