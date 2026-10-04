import type {ImmersiveTechJsonMetadata} from "@immersive-tech-json/metadata/contract"
type NodeJsonValue = ImmersiveTechJsonMetadata.Input[0]

/** Читает собственное поле JSON-объекта. */
export declare namespace ImmersiveTechJsonMetadataRead {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1]]
  type Output = NodeJsonValue | undefined
}
