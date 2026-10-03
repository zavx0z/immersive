import type {NodesMetadata} from "@nodes/metadata/contract"

/** Заимствует массив строк, если каждый его элемент имеет подходящий тип. */
export declare namespace NodeMetadataStringArray {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1]]
  type Output = readonly string[] | undefined
}
