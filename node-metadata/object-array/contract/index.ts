import type {NodesMetadata} from "@nodes/metadata/contract"
type NodeJsonObject = Extract<NodesMetadata.Input[0], Readonly<Record<string, NodesMetadata.Input[0]>>>

/** Заимствует массив JSON-объектов, если каждый его элемент имеет подходящий тип. */
export declare namespace NodeMetadataObjectArray {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1]]
  type Output = readonly NodeJsonObject[] | undefined
}
