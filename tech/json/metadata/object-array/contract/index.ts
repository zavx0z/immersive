import type {ImmersiveTechJsonMetadata} from "@immersive-tech-json/metadata/contract"
type NodeJsonObject = Extract<ImmersiveTechJsonMetadata.Input[0], Readonly<Record<string, ImmersiveTechJsonMetadata.Input[0]>>>

/** Заимствует массив JSON-объектов, если каждый его элемент имеет подходящий тип. */
export declare namespace ImmersiveTechJsonMetadataObjectArray {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1]]
  type Output = readonly NodeJsonObject[] | undefined
}
