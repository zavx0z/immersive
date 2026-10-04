/**
Читает конечное число, сохраняя ноль.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonMetadataNumber as Contract} from "./contract"
export type {Zavx0zImmersiveTechJsonMetadataNumber} from "./contract"
import metadata from "@zavx0z/immersive-tech-json-metadata-read"

export default function metadataNumber(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined
}
