import type {ImmersiveTechJsonMetadata} from "@immersive-tech-json/metadata/contract"

/** Заимствует массив строк, если каждый его элемент имеет подходящий тип. */
export declare namespace ImmersiveTechJsonMetadataStringArray {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1]]
  type Output = readonly string[] | undefined
}
