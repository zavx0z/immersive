import type {NodesMetadata} from "@nodes/metadata/contract"

/** Читает непустую строку либо возвращает резервное значение. */
export declare namespace NodeMetadataString {
  type Input = readonly [value: NodesMetadata.Input[0], key: NodesMetadata.Input[1], fallback: string]
  type Output = string
}
