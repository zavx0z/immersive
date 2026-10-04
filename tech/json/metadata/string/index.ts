/**
Читает непустую строку либо возвращает резервное значение.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonMetadataString as Contract} from "./contract"
export type {Zavx0zImmersiveTechJsonMetadataString} from "./contract"
import metadata from "@zavx0z/immersive-tech-json-metadata-read"

export default function metadataString(value: Contract.Input[0], key: Contract.Input[1], fallback: Contract.Input[2]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "string" && candidate.length > 0 ? candidate : fallback
}
