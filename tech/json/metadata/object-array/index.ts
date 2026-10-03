/**
Заимствует массив JSON-объектов, если каждый его элемент имеет подходящий тип.

@packageDocumentation
*/
import type {NodeMetadataObjectArray as Contract} from "./contract"
export type {NodeMetadataObjectArray} from "./contract"
import metadata from "@node-metadata/read"
type NodeJsonObject = NonNullable<Contract.Output>[number]

export default function metadataObjectArray(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  const candidate = metadata(value, key)
  if (!Array.isArray(candidate) || !candidate.every(entry => entry !== null && typeof entry === "object" && !Array.isArray(entry))) {
    return undefined
  }
  return candidate as readonly NodeJsonObject[]
}
