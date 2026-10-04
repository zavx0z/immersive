/**
Заимствует массив JSON-объектов, если каждый его элемент имеет подходящий тип.

@packageDocumentation
*/
import type {ImmersiveTechJsonMetadataObjectArray as Contract} from "./contract"
export type {ImmersiveTechJsonMetadataObjectArray} from "./contract"
import metadata from "@zavx0z/immersive-tech-json-metadata-read"
type NodeJsonObject = NonNullable<Contract.Output>[number]

export default function metadataObjectArray(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  const candidate = metadata(value, key)
  if (!Array.isArray(candidate) || !candidate.every(entry => entry !== null && typeof entry === "object" && !Array.isArray(entry))) {
    return undefined
  }
  return candidate as readonly NodeJsonObject[]
}
