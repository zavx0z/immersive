import type {NodesMetadata} from "@nodes/metadata/contract"
type NodeJsonValue = NodesMetadata.Input[0]

/** Читает собственное поле JSON-объекта. */
export declare namespace NodeMetadataRead {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1]]
  type Output = NodeJsonValue | undefined
}
