import type {NodesMetadata} from "@nodes/metadata/contract"

/** Читает логическое значение, сохраняя false. */
export declare namespace NodeMetadataBoolean {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1], fallback: boolean]
  type Output = boolean
}
