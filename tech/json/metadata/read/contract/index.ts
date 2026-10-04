import type {Zavx0zImmersiveTechJsonMetadata} from "@zavx0z/immersive-tech-json-metadata/contract"
type NodeJsonValue = Zavx0zImmersiveTechJsonMetadata.Input[0]

/** Читает собственное поле JSON-объекта. */
export declare namespace Zavx0zImmersiveTechJsonMetadataRead {
  type Input = readonly [value: Zavx0zImmersiveTechJsonMetadata.Input[0], key: Zavx0zImmersiveTechJsonMetadata.Input[1]]
  type Output = NodeJsonValue | undefined
}
