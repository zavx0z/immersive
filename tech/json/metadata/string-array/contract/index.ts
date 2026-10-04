import type {Zavx0zImmersiveTechJsonMetadata} from "@zavx0z/immersive-tech-json-metadata/contract"

/** Заимствует массив строк, если каждый его элемент имеет подходящий тип. */
export declare namespace Zavx0zImmersiveTechJsonMetadataStringArray {
  type Input = readonly [value: Zavx0zImmersiveTechJsonMetadata.Input[0], key: Zavx0zImmersiveTechJsonMetadata.Input[1]]
  type Output = readonly string[] | undefined
}
