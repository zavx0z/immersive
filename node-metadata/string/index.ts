/**
Читает непустую строку либо возвращает резервное значение.

@packageDocumentation
*/
import type {NodeMetadataString as Contract} from "./contract"
export type {NodeMetadataString} from "./contract"
import metadata from "@node-metadata/read"

export default function metadataString(value: Contract.Input[0], key: Contract.Input[1], fallback: Contract.Input[2]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "string" && candidate.length > 0 ? candidate : fallback
}
