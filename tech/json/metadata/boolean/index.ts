/**
Читает логическое значение, сохраняя false.

@packageDocumentation
*/
import type {ImmersiveTechJsonMetadataBoolean as Contract} from "./contract"
export type {ImmersiveTechJsonMetadataBoolean} from "./contract"
import metadata from "@zavx0z/immersive-tech-json-metadata-read"

export default function metadataBoolean(value: Contract.Input[0], key: Contract.Input[1], fallback: Contract.Input[2]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "boolean" ? candidate : fallback
}
