import type {NodesMetadata} from "@nodes/metadata/contract"

/** Читает конечное число, сохраняя ноль. */
export declare namespace NodeMetadataNumber {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1]]
  type Output = number | undefined
}
