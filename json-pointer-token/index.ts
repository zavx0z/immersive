/**
Кодирует одну часть JSON Pointer без ведущего разделителя.

@packageDocumentation
*/
import type {NodesJsonPointerToken as Contract} from "./contract"
export type {NodesJsonPointerToken} from "./contract"

export default function encodeJsonPointerToken(value: Contract.Input): Contract.Output {
  if (typeof value !== "string") throw new TypeError("JSON Pointer token must be a string")
  return value.replaceAll("~", "~0").replaceAll("/", "~1")
}
