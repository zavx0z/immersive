/**
Читает конечное число, сохраняя ноль.

@packageDocumentation
*/
import type {NodeMetadataNumber as Contract} from "./contract"
export type {NodeMetadataNumber} from "./contract"
import metadata from "@node-metadata/read"

export default function metadataNumber(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  const candidate = metadata(value, key)
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined
}
