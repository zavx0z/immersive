import type {Zavx0zImmersiveTechJsonMetadata} from "@zavx0z/immersive-tech-json-metadata/contract"
type NodeJsonObject = Extract<Zavx0zImmersiveTechJsonMetadata.Input[0], Readonly<Record<string, Zavx0zImmersiveTechJsonMetadata.Input[0]>>>

/** Заимствует массив JSON-объектов, если каждый его элемент имеет подходящий тип. */
export declare namespace Zavx0zImmersiveTechJsonMetadataObjectArray {
  type Input = readonly [value: Zavx0zImmersiveTechJsonMetadata.Input[0], key: Zavx0zImmersiveTechJsonMetadata.Input[1]]
  type Output = readonly NodeJsonObject[] | undefined
}
