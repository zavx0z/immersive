/**
Заимствует массив строк, если каждый его элемент имеет подходящий тип.

@packageDocumentation
*/
import type {ImmersiveTechJsonMetadataStringArray as Contract} from "./contract"
export type {ImmersiveTechJsonMetadataStringArray} from "./contract"
import metadata from "@immersive-tech-json-metadata/read"

export default function metadataStringArray(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  const candidate = metadata(value, key)
  if (!Array.isArray(candidate) || !candidate.every(entry => typeof entry === "string")) return undefined
  return candidate as readonly string[]
}
