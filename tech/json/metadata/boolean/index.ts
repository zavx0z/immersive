/**
Читает логическое значение, сохраняя false.

@packageDocumentation
*/
import type {NodeMetadataBoolean as Contract} from "./contract"
export type {NodeMetadataBoolean} from "./contract"
import metadata from "@node-metadata/read"

export default function metadataBoolean(value: Contract.Input[0], key: Contract.Input[1], fallback: Contract.Input[2]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "boolean" ? candidate : fallback
}
