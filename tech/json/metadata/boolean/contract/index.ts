import type {ImmersiveTechJsonMetadata} from "@zavx0z/immersive-tech-json-metadata/contract"

/** Читает логическое значение, сохраняя false. */
export declare namespace ImmersiveTechJsonMetadataBoolean {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1], fallback: boolean]
  type Output = boolean
}
