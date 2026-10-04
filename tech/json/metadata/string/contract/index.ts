import type {ImmersiveTechJsonMetadata} from "@immersive-tech-json/metadata/contract"

/** Читает непустую строку либо возвращает резервное значение. */
export declare namespace ImmersiveTechJsonMetadataString {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1], fallback: string]
  type Output = string
}
